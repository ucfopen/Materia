<?php
/**
 * Model for the Semesters
 *
 * The widget managers for the Materia package.
 *
 * @package	    Main
 * @subpackage  perms * @author      ADD NAME HERE
 */

namespace Materia;

class Semester
{
	public $end_at;
	public $id;
	public $semester;
	public $start_at;
	public $year;

	public function __construct($properties=[])
	{
		if ( ! empty($properties))
		{
			foreach ($properties as $key => $val)
			{
				if (property_exists($this, $key)) $this->{$key} = $val;
			}
		}
	}
	/**
	 * Gets a single semester
	 *
	 * @param string the semester to get
	 * @param string the year to get
	 */
	public function get($semester, $year)
	{
		$results = \DB::select()
			->from('date_range')
			->where([
				'semester' => $semester,
				'year'     => $year,
			])
		 	->execute();

		$this->__construct($results[0]);
	}
	/**
	 * Get all the semester information
	 */
	public static function get_all()
	{
		$semesters = \DB::select()
			->from('date_range')
			->execute();

		$result = [];
		foreach ($semesters as $semester)
		{
			$result[] = new Semester($semester);
		}
		return $result;
	}

	public static function get_current_semester()
	{
		// TODO: move this caching into find_date_by_time
		$id = \Cache::easy_get('current-semester');

		if (is_null($id))
		{
			$id = self::find_date_by_time(time());
			\Cache::set('current-semester', $id, 86400); // expiration is for 24 hours
		}

		return $id;
	}

	public static function find_date_by_time($time)
	{
		$results = \DB::select('id')
			->from('date_range')
			->where('start_at', '<', $time)
			->and_where('end_at', '>', $time)
			->execute()
			->as_array();

		return $results[0]['id'];
	}
}
