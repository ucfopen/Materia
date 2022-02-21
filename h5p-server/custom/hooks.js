module.exports = {
  /**
   * This hook is called when the editor retrieves the semantics of a
   * library.
   * Note: This function should be immutable, so it shouldn't change the
   * semantics parameter but return a clone!
   * @param library the library that is currently being loaded
   * @param semantics the original semantic structure
   * @returns the changed semantic structure
   */
  alterLibrarySemanticsHook: (library, semantics) => {
    // Updating the Library.fields.options array to remove
    // "H5P.Video" from the allowed options, so users cannot upload
    // videos to any h5p widgets, as materia cannot support video files
    if (semantics[0].hasOwnProperty("fields")) {
      if (semantics[0].fields[0].hasOwnProperty("options")) {
        semantics[0].fields[0].options = semantics[0].fields[0].options.filter(
          library => {
            // messy but have to check if it is a string array
            // because of course all h5p widgets have to be different
            if (typeof library == "string") {
              return !library.startsWith("H5P.Video");
            }
            // if not a string array then just return `true` to the filter
            // to not remove anything
            return true;
          }
        );
      }
    }
    return semantics;
  }
};
