<?php

namespace Materia;

class Widget_Question_Generator
{
	protected static $client;

	/**
	 * Initializes and returns the OpenAI client based on current server configuration.
	 *
	 * @return mixed An instance of the OpenAI client.
	 */
	protected static function get_client()
	{
		if ( ! isset(self::$client) && self::is_enabled())
		{
			if (empty(\Config::get('materia.ai_generation.provider')))
			{
				\Log::error('GENERATION ERROR: Question generation configs missing.');
				return null;
			}

			if (\Config::get('materia.ai_generation.provider') == 'azure_openai')
			{
				$api_key = \Config::get('materia.ai_generation.api_key');
				$endpoint = \Config::get('materia.ai_generation.endpoint');
				$api_version = \Config::get('materia.ai_generation.api_version');

				if (empty($api_key) || empty($endpoint) || empty($api_version))
				{
					\Log::error('GENERATION ERROR: Question generation configs missing.');
					return null;
				}

				try {
					self::$client = \OpenAI::factory()
						->withBaseUri($endpoint)
						->withHttpHeader('api-key', $api_key)
						->withQueryParam('api-version', $api_version)
						->make();
				} 
				catch (\Exception $e)
				{
					\Log::error('GENERATION ERROR: error in initializing openAI client');
					\Log::error($e);
					return null; 
				}
			}
			elseif (\Config::get('materia.ai_generation.provider') == 'openai')
			{
				$api_key = \Config::get('materia.ai_generation.api_key');

				if (empty($api_key))
				{
					\Log::error('Question generation configs missing.');
					return null;
				}

				self::$client = \OpenAI::client($api_key);
			}
			else
			{
				\Log::error('GENERATION ERROR: Question generation provider config invalid.');
				return null;
			}
		}
		return self::$client;
	}

	/**
	 * Quick reference method to determine whether question generation is enabled.
	 *
	 * @return bool Returns true if the widget generator is enabled, false otherwise.
	 */
	public static function is_enabled()
	{
		return ! empty(\Config::get('materia.ai_generation.enabled'));
	}

	/**
	 * Submits a prompt to the configured question generation provider.
	 *
	 * @param string $prompt The prompt for the query.
	 * @return object The result of the query.
	 */
	public static function query($prompt)
	{
		$client = static::get_client();
		if (empty($client)) throw new \HttpNotFoundException;

		$params = [
			'response_format' => (object) ['type' => 'json_object'],
			'messages' => [
				['role' => 'user', 'content' => $prompt]
			],
			'max_tokens' => 16000,
			'frequency_penalty' => 0, // 0 to 1
			'presence_penalty' => 0, // 0 to 1
			'temperature' => 1, // 0 to 1
			'top_p' => 1, // 0 to 1
		];

		if ( ! empty(\Config::get('materia.ai_generation.model')))
		{
			$params['model'] = \Config::get('materia.ai_generation.model');
		}

		return $client->chat()->create($params);
	}

	/**
	 * Generate a question set for a widget instance
	 *
	 * @param Widget_Instance $inst the instance associated with this request (if present)
	 * @param Widget $widget the widget engine associated with this request
	 * @param string $topic the topic to be used as the basis of the generated qset
	 * @param bool $include_images whether or not to include images in the generated qset
	 * @param int $num_questions the number of questions to generate within the qset
	 * @param bool $existing whether to build on an existing qset or generate one from scratch
	 * @return array returns an array with the generated qset
	 */
	static public function generate_qset($inst, $widget, $topic, $include_images, $num_questions, $existing)
	{
		if ( ! self::is_enabled()) return new Msg(Msg::ERROR, 'Question generation is not enabled.');

		// 'allow images' environment variable overrides whatever the api request sends
		if ( empty(\Config::get('materia.ai_generation.allow_images'))) $include_images = false;

		$demo = Widget_Instance_Manager::get($widget->meta_data['demo']);
		if ( ! $demo) throw new \HttpNotFoundException;
		
		if ($inst) $instance_name = $inst->name;
		$widget_name = $widget->name;
		$about = $widget->meta_data['about'];
		$qset_version = 1;

		// grab the custom prompt from the widget engine, if it's available
		$custom_engine_prompt = isset($widget->meta_data['generation_prompt']) ? $widget->meta_data['generation_prompt'][0] : null;

		// time for logging
		$start_time = microtime(true);
		$time_elapsed_secs = 0;

		// **********************************
		//        prompt assembly
		// **********************************

		// appending new questions to an existing qset. The instance must have been previously saved.
		if ($existing)
		{
			if ( ! $inst) return Msg::invalid_input('Requires a previously saved instance to build from.');
			$qset = Api_V1::question_set_get($inst->id);
			if ( ! $qset) return new Msg(Msg::ERROR, 'No existing question set found');
			$qset_version = $qset->version;

			$qset_text = json_encode($qset->data);

			// non-demo non-image prompt
			$text = "{$widget->name} is a 'widget', an interactive piece of educational web content described as: '{$about}'. ".
					'Using the exact same json format of the following question set, without changing any field keys or data types and without changing any of the existing questions, '.
					"generate {$num_questions} more questions and add them to the existing question set. ".
					"The name of this particular instance of {$widget->name} is {$instance_name} and the new questions must be based on this topic: '{$topic}'. ".
					'Return only the JSON for the resulting question set.';

			if ($include_images)
			{
				$text = $text." In every asset or assets object in each new question, add a field titled 'description' ".
				"that best describes the image within the answer or question's context, unless otherwise specified later on in this prompt. ".
				"Do not generate descriptions that would violate OpenAI's image generation safety system and do not use real names. IDs must be null.";
			}
			else
			{
				$text = $text.' Leave the asset field empty or otherwise equivalent to asset fields in questions with no associated asset. IDs must be null.';
			}

			if ($custom_engine_prompt && ! empty($custom_engine_prompt))
			{
				$text = $text." Lastly, the following instructions apply to the {$widget->name} widget specifically, and supersede earlier instructions where applicable: {$custom_engine_prompt}";
			}

			$text = $text."\n{$qset_text}";
		}
		else // creating a new qset based on the demo. Does not require a previously saved instance
		{
			// get the demo.json from the demo instance
			$demo_qset = Api_V1::question_set_get($widget->meta_data['demo']);
			$qset_version = $demo_qset->version;
			if ( ! $demo_qset) throw new \HttpNotFoundException;
			$qset_text = json_encode($demo_qset->data);

			// non-image prompt
			$text = "{$widget->name} is a 'widget', an interactive piece of educational web content described as: '{$about}'. ".
					"The following is a 'demo' question set for the widget titled {$demo->name}. ".
					'Using the same json format as the demo question set, and without changing any field keys or data types, return only the JSON '.
					"for a question set based on this topic: '{$topic}'. Ignore the topic of the demo contents entirely. ".
					"Replace the relevant field values with generated values. Generate a total {$num_questions} of questions. ".
					'IDs must be NULL.';

			// image prompt
			if ($include_images)
			{
				$text = $text." In every asset or assets object in each new question, add a field titled 'description' ".
				"that best describes the image within the answer or question's context, unless otherwise specified later on in this prompt. ".
				"Do not generate descriptions that would violate OpenAI's image generation safety system and do not use real names. IDs must be null.";
			}
			else
			{
				$text = $text.' Asset fields associated with media (image, audio, or video) should be left blank. '.
						"For text assets, or if the 'materiaType' of an asset is 'text', create a field titled 'value' ".
						'with the text inside the asset object.';
			}

			if ($custom_engine_prompt && ! empty($custom_engine_prompt))
			{
				$text = $text." Lastly, the following instructions apply to the {$widget->name} widget specifically, and supersede earlier instructions where applicable: {$custom_engine_prompt}";
			}

			$text = $text."\n{$qset_text}";
		}

		// send the prompt to to the generative AI provider
		try {
			$result = self::query($text);

			// received the qset - decode the json string from the result
			$question_set = json_decode($result->choices[0]->message->content);
			\Log::info('Generated question set: '.print_r(json_encode($question_set), true));

			if (\Config::get('materia.ai_generation.log_stats'))
			{
				$time_elapsed_secs = microtime(true) - $start_time;

				\Log::debug(PHP_EOL
					.'Widget: '.$widget_name.PHP_EOL
					.'Date: '.date('Y-m-d H:i:s').PHP_EOL
					.'Time to complete (in seconds): '.$time_elapsed_secs.PHP_EOL
					.'Number of questions asked to generate: '.$num_questions.PHP_EOL
					.'Included images: '.$include_images.PHP_EOL
					.'Prompt tokens: '.$result->usage->promptTokens.PHP_EOL
					.'Completion tokens: '.$result->usage->completionTokens.PHP_EOL
					.'Total tokens: '.$result->usage->totalTokens.PHP_EOL);
			}

		} catch (\Exception $e) {
			\Log::error('Error generating question set:'.PHP_EOL
				.'Widget: '.$widget_name.PHP_EOL
				.'Date: '.date('Y-m-d H:i:s').PHP_EOL
				.'Time to complete (in seconds): '.$time_elapsed_secs.PHP_EOL
				.'Number of questions asked to generate: '.$num_questions.PHP_EOL
				.'Error: '.$e->getMessage().PHP_EOL);

			return new Msg(Msg::ERROR, 'Error generating question set');
		}

		if ($include_images) $question_set = static::generate_images($question_set, $existing);

		return [
			'qset' => $question_set,
			'version' => $qset_version
		];
	}


	/**
	 * Generate images for a question set.
	 *
	 * This function generates images for a given question set and existing images.
	 *
	 * @param array $question_set The question set for which images need to be generated.
	 * @return void
	 */
	static public function generate_images($question_set)
	{
		// get an array of asset descriptions from the qset
		$assets = static::comb_assets($question_set);

		$num_assets = count($assets);
		if ($num_assets < 1) return $question_set;

		// the dall-e-2 model can generate multiple images for a single prompt, but those are variations of the same image
		// in order to generate images for each individual description, calls must be made concurrently
		// this is not ideal - perhaps individual image generation is tied to an api endpoint which is facilitated by the front end
		foreach ($assets as $description)
		{
			// generate image
			try {
				$client = static::get_client();
				$dalle_result = $client->images()->create([
					'model' => 'dall-e-2',
					'prompt' => $description,
					'response_format' => 'b64_json',
					'size' => '512x512' // 256x256, 512x512, 1024x1024
				]);

			} catch (\Exception $e) {
				\Log::error('Error generating images: '.$e->getMessage());
				\Log::error('Trace: '.$e->getTraceAsString());

				return $question_set;
			}

			// decode the base64 file data
			$file_data = base64_decode($dalle_result->data[0]->b64_json);

			// Create a temporary file to store the binary image contents
			$temp_file_path = tempnam(sys_get_temp_dir(), 'dalle_sideload_');
			file_put_contents($temp_file_path, $file_data);

			// copy asset to where files would normally be uploaded to
			// this is largely mirrored from sideloading demo assets
			$src_area = \File::forge(['basedir' => sys_get_temp_dir()]); // restrict copying from system tmp dir
			$mock_upload_file_path = \Config::get('file.dirs.media_uploads').uniqid('sideload_');
			\File::copy($temp_file_path, $mock_upload_file_path, $src_area, 'media');

			// process the upload and turn it into a file
			$upload_info = \File::file_info($mock_upload_file_path, 'media');
			$asset = \Materia\Widget_Asset_Manager::new_asset_from_file(static::string_to_slug($description), $upload_info);

			if ( ! isset($asset->id))
			{
				\Log::error('Unable to create asset');
			}
			else
			{
				static::assign_asset($question_set, $description, $asset);
			}
		}
		return $question_set;
	}

	/**
	 * Combines all asset descriptions in a question set into a single array
	 * @param array $qset The question set array
	 * @return array The array of asset descriptions
	 */
	static public function comb_assets($qset)
	{
		$assets = [];
		foreach ($qset as $key => $value)
		{
			if (is_object($value) || is_array($value))
			{
				$value = (array) $value;
				if ($key == 'asset' || $key == 'image' || $key == 'audio' || $key == 'video' || $key == 'options')
				{
					if (key_exists('description', $value) && ! empty($value['description']))
					{
						$assets[] = $value['description'];
					}
				}
				if ($key == 'assets')
				{
					$value = (array) $value;
					foreach ($value as $asset)
					{
						$asset = (array) $asset;
						if (key_exists('description', $asset) && ! empty($asset['description']))
						{
							$assets[] = $asset['description'];
						}
					}
				}
				$assets = array_merge($assets, static::comb_assets($value));
			}
		}
		return $assets;
	}

	/**
	 * Assigns a generated image asset to a qset based on the image description
	 * @param array $array The question set
	 * @param string $description the string used to describe (and generate) the image asset
	 * @param object $asset the asset object (of type \Materia\Widget_Asset)
	 * @return bool Returns true if asset was inserted into the question set
	 */
	static public function assign_asset(&$array, $description, $asset)
	{
		foreach ($array as $key => &$value)
		{
			if (is_object($value) || is_array($value))
			{
				if ($key == 'asset' || $key == 'image' || $key == 'audio' || $key == 'video')
				{
					if (isset($value->description) && $value->description == $description)
					{
						$value->id = $asset->id;
						return true;
					}
					else return false;
				}
				elseif ($key == 'assets')
				{
					foreach ($value as &$item)
					{
						if (isset($item->description) && $item->description == $description)
						{
							$item->id = $asset->id;
							return true;
						}
						else return false;
					}
				}
				else
				{
					$result = self::assign_asset($value, $description, $asset);
					if ($result == true) return $result;
				}
			}
		}
		return false;
	}

	// helper function to turn a natural language description into a url-safe and filesystem-safe slug
	static public function string_to_slug($string)
	{
		// Convert the string to lowercase
		$string = strtolower($string);
		
		// Remove non-alphanumeric characters (except spaces)
		$string = preg_replace('/[^a-z0-9\s]/', '', $string);
		
		// Replace spaces with hyphens
		$string = str_replace(' ', '-', $string);
		
		// Trim any leading or trailing hyphens
		$string = trim($string, '-');
		
		return $string;
	}
}