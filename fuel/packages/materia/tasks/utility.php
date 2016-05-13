<?php

namespace Fuel\Tasks;

class Utility extends \Basetask
{
	public static function output_questions_and_answers_for_instance($inst)
	{
		\Cli::write('Generating questions and answers for '.$inst.'...');

		if ($inst == null)
		{
			\Cli::write('No instance ID provided, dummy!');
		}

		$qset = \DB::select('data')
			->from('widget_qset')
			->where('inst_id', '=', $inst)
			->order_by('created_at', 'desc')
			->limit(1)
			->as_assoc()
			->execute();

		$data = json_decode(base64_decode($qset->as_array()[0]['data']), true);

		$questions = \Materia\Widget_Instance::find_questions($data);

		$csv = [];
		$headers = "Question, Answers\r\n";

		$string = $headers;

		foreach ($questions as $question)
		{
			$sanitized_question = str_replace(["\r","\n", ','], '', $question->questions[0]['text']);
			$sanitized_answers = [];

			foreach ($question->answers as $answer)
			{
				$sanitized_answer = str_replace(["\r","\n", ','], '', $answer['text']);
				array_push($sanitized_answers, $sanitized_answer);
			}

			$string .= $sanitized_question.', '.implode(', ', $sanitized_answers)."\r\n";
		}


		$file = fopen($inst.'-questions-answers.csv', 'w');
		fwrite($file, $string);
		fclose($file);

		if (file_exists($inst.'-questions-answers.csv'))
		{
			\Cli::write('File created in your root Materia directory: '.$inst.'-questions-answers.csv');
		}
		else
		{
			\Cli::write('Something broke, the CSV file was not generated!');
		}
	}

}