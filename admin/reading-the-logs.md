---
layout: page
title: Materia Log Files
tagline: Understanding the Materia Logs
class: admin
---
{% include JB/setup %}

# Reading Materia's Log Files #

## Location
Materia uses the standard logging functionality built into FuelPHP.  Logs are written to the `/fuel/app/logs/YYYY/MM/` directory.  We do however have several files to keep some logging easier to process.

<aside>
	FuelPHP offers several options to control logging, view them <a href="http://fuelphp.com/docs/classes/log.html">in the FuelPHP log documentation</a>.
</aside>

## General Logs ##

**&lt;DAY&gt;.php**: General errors and debug statements are written here.  The Materia debugging function `trace()` will also write to this file.

## Login Authentication ##

**&lt;DAY&gt;-login.php**: Every login attempt is registered here. These are structured in a CSV format with the following columns:

1. Username
2. Login Method
3. Success
4. Unix Timestamp

## LTI logging ##

**&lt;DAY&gt;-lti.php**: Logs from lti messages sent or received.

These logs are structured in a specific format format.  They are comma seperated values, with one log per line.  Each line has the following columns in order:

1. Log Type
2. Instance ID
3. User ID
4. Service Url
5. Score
6. Source ID
7. Unix Timestamp

Possible Log types:

* __session-init__: The consumer has sent a launch message to Materia, and they should be logged in at this point.
* __outcome-no-passback__: Materia was lauched by the consumer, and the user completed a widget, but for some reason, no score was passed back to the   This can happen when the consumer doesn't send a passback url, or when some required data was not found or is not valid.
* __outcome-success__: A score was sent back to the consumer successfully.
* __outcome-failure__: A score was sent back to the consumer.  However, there was a failure when sending or verifying the consumer's response.