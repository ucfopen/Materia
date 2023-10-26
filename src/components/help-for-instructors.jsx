import React from 'react';

const HelpForInstructors = () => {

	return (
		<>
			<section className='full-width'>
				<h2>For Instructors</h2>
				<p>Check out the <a href="https://cdl.ucf.edu/support/materia/materia-quick-start-guide/" className="external">Materia Quickstart Guide</a> for a brief introduction to creating a new widget.</p>
			</section>
			<section className='full-width'>
				<h2>Common Questions &amp; Issues</h2>
				<h3>General</h3>
				<dl>
					<dt>Is Materia part of the LMS?</dt>
					<dd>
						<p>No. Materia is a platform that operates independently to the LMS, but integrates with it through a protocol called LTI.
						You can authenticate to Materia through LTI, or directly by visiting the Login button.</p>
					</dd>
					<dt>Are there login credentials specific to Materia?</dt>
					<dd>
						<p>That depends on how your institution has configured Materia. If you visit Materia through your LMS, authentication is handled for you. If you login directly to Materia,
						you may need credentials specifically set up for Materia. If logging in transitions you to a an external login, use the credentials associated with that external login instead.</p>
					</dd>
					<dt>I'm an instructor, why does Materia think I'm suddenly a student?</dt>
					<dd>
						<p>Materia defers to your LMS when receiving login information that may include your role in the course you last accessed Materia from. Depending on your course role,
						your role in Materia may update to match. For example, if you are instructor in Course A but a student in Course B, Materia will flag you as a student if you visit
						Materia content embedded in Course B. Visiting Materia content in Course A will once again grant you the author role.</p>
					</dd>
					<dt>Can my students author widgets?</dt>
					<dd>
						<p>Yes they can, but student-authored widgets have several limitations. Primarily, the widget is forced into Guest Mode, which removes the login requirement, but all scores
						recorded by Guest Mode widgets are anonymous. Student-authored widgets cannot be embedded in your LMS, and if a student grants you access, you cannot disable Guest Mode.
						Students can freely share their widgets with other users using the Play URL or Embed Code.</p>
					</dd>
				</dl>
				<h3>Scores & Grades</h3>
				<dl>
					<dt>Does Materia save student grades?</dt>
					<dd>
						<p>Materia does not save grade information, but it does save student performance data. Student scores are stored and can be reviewed any time by 
						visiting the Student Activity section of a widget in My Widgets. When embedded in your LMS, Materia sends a score percentage to the LMS that's 
						then applied as a point value or grade by the LMS itself for an assignment.</p>
					</dd>
					<dt>How does scoring work?</dt>
					<dd>
						<p>By default, a student must authenticate to Materia - either automatically, when accessed through the LMS, or directly, by clicking the Login button - 
						so the system knows who they are and who to associate a score with. All score data for a widget is accessible under the Student Activity section in My Widgets.
						Additionally, student performance data can be exported at any time by clicking the Export Options button in My Widgets.</p>
					</dd>
					<dt>My widget is embedded in the LMS but the gradebook did not update! What happened?</dt>
					<dd>
						<p>This can happen for multiple reasons. First, ensure the widget is properly embedded in your LMS by reviewing <a href='https://ucfopen.github.io/Materia-Docs/create/embedding-in-canvas.html' target='_blank'>our documentation for embedding widgets in Canvas. </a>
						Next, verify the score the student recieved by reviewing the widget's Student Activity section in Materia under My Widgets. If a score is present in Materia but not synced with the gradebook, contact Support. Often the "handshake" between Materia and the LMS can 
						fail or be invalidated for several reasons that are not nefarious.</p>
					</dd>
				</dl>
				<h3>Widget Ownership</h3>
				<dl>
					<dt>Can I give other instructors access to a widget?</dt>
					<dd>
						<p>Yes. Select <span className='bold'>Collaborate</span> in My Widgets to share widgets with other users. You can search for any other Materia user in the search field,
						provided they've interacted with Materia at least once in the past. You can grant other users one of two access levels: <span className='bold'>Full</span>, which 
						effectively makes a user a co-owner, or <span className='bold'>View Scores</span>, which allows a user to share and read score information related to a widget but they cannot edit it.</p>
					</dd>
					<dt>Can I make students co-owners of a widget?</dt>
					<dd>
						<p>You cannot share widgets with students unless they have been set to <span className='bold'>Guest Mode</span>, under a widget's access settings. As a general rule, Materia will not 
						allow students ownership access to widgets unless the scores associated with the widgets are anonymized. Conversely, widgets authored by students are forced into Guest Mode, and changing a student widget
						you co-own to Normal Access will remove the student as an owner.</p>
					</dd>
					<dt>I see a widget embedded in my course in the LMS, but I don't own it. What do I do?</dt>
					<dd>
						<p>Don't panic! Even if you don't own the widget, it will continue to function normally, and sync scores with the gradebook if configured to do so. If you're an author of the course,
						you will be provided with a list of owners of the widget, and can select <span className='bold'>Request Access</span> from any owner. The owner will receive a notification in Materia
						and be provided with an option to add you as a collaborator. Note that this does not guarantee you will receive access! In cases where the original owner is no longer associated with your institution, feel free to 
						contact Support.</p>
					</dd>
				</dl>
				<h3>Miscellaneous</h3>
				<dl>
					<dt>How do I activate Beard Mode?</dt>
					<dd>
						<p>What? We don't know what you're talking about.</p>
					</dd>
				</dl>
			</section>
		</>
	)
}

export default HelpForInstructors
