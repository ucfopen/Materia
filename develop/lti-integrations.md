---
layout: page
title: LTI Integration Overview
tagline: How Materia works as an LTI tool.
class: developers
---
{% include JB/setup %}

# LTI Integrations #

Materia can be embedded into other systems that support [the LTI standard](http://www.imsglobal.org/toolsinteroperability2.cfm) for regular or graded external tools. This standard allows Materia to securely authenticate users and pass scores back to the external system.

## LTI Roles ##

There are many [roles in the LTI standard](http://www.imsglobal.org/LTI/v1p1/ltiIMGv1p1.html#_Toc319560486). They are far too granular for Materia's purposes, so we group the roles together into two capabilities: Instructor and Student.  Instructors are given control of which widget the resource links to, while students are simply logged in and shown the chosen widget.

### Instructor Role ###

Instructors are able to create widgets and link to them from a given resource in the LMS. (resource in this case refers to an assignment or content module).

<aside>
	This role is used when Materia receives one of these LTI roles: `Administrator`, `Instructor` or `ContentDeveloper`.
</aside>

### Student Role ###

A students' role is so streamlined that they will probably not realize they are using an external application. The LTI consumer will send along the user's information and resource id, which are used to log them in and locate the desired widget. Typically the student will just see the working widget embedded in the page.

<aside>
	This role is used when Materia receives one of these LTI roles: `Learner` or `Student`.
</aside>

## Selecting a Widget as an Instructor ##

![Selecting a widget from within another system via a LTI integration]({{BASE_PATH}}/assets/img/lti-select-thumb.png)

The above screen will be shown inside the LMS (usually within an iframe) when the instructor views the assignment.  The instructor then needs to choose a widget to link this LMS resource. This linking process is how Materia knows which widget to display to students, and must be completed every time Materia is used as an LTI tool.

<aside>
	If the course containing the linked Materia Widget is copied or moved, the LMS may reset this selection because it assignes a new `lis_resourt_sourceid`.
</aside>

## Score Passback ##

When a student views a page with the LTI widget embedded in it, information about how to send scores back to the consumer are sent to Materia.  Materia stores that info, and uses it to return score data once the student completes the widget. Materia uses the `lis_outcome_service_url` parameter to determine if it should send a score, and where to send it to.  Materia will use the [replaceResult](http://www.imsglobal.org/LTI/v1p1/ltiIMGv1p1.html#_Toc319560473) message which can allow multiple widget attempts to overwrite the previous scores.

## LTI Configuration XML ##

The configuration url is: `http://materia/lti`. The default configuration allows for grade passback, and designates a picker interface that your consumer will display to choose a widget to link to.

## Materia LTI Launch Message ##

You should send a post request to `http://materia/lti/assignment/` with the following parameters

| Param | Description |
| --- | --- |
| `oauth_consumer_key` | **Required**. Matches the configuration's key. |
| `oauth_nonce` | **Required**. An arbitrary number only used once. |
| `oath_timestamp` | **Required**. A unix timestamp for when the signature was signed. |
| `tool_consumer_instance_guid` | **Required**. Unique identifier of your consumer install. |
| `tool_consumer_info_product_family_code` | **Required**. Type of consumer (eg: Canvas. Obojobo). Used to determine configuration settings. |
| `resource_link_id` | **Required**. Unique id for this widget use. |
| `roles` | **Required**. This role tells Materia to expect to show the selection screen. |
| `launch_presentation_return_url` | Optional. Used by the picker interface to set the link to this widget in the consumer. |
| `context_id` | Optional. ID of the course. |
| `context_title` | Optional. Name of the course. |
| `user_id` | Optional. User ID of the user performing the operation. |
| `lis_outcome_service_url` | Optional. If set, Materia sends the final widget score to this url. See Score Passback above. |
| `lis_result_sourcedid` | Optional. ID sometimes required by the consumer to return scores. |
| `lis_person_sourcedid` | Optional. Often used as the user ID to match in Materia's local data. |
| `lis_person_name_family` | Optional. User's last name. |
| `lis_person_name_given` | Optional. User's first name. |
| `lis_person_contact_email_primary` | Optional. Useful if Materia is set up to create users on LTI handshakes. |
| `custom_widget_instance_id` | Optional. Some systems (like Obojobo) know the ID of the widget it's requesting. |