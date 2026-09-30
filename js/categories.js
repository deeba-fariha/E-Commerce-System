// =========================================================
// APEXMART - SHARED CATEGORY LIST (js/categories.js)
// =========================================================
// Categories live in the database (GET /api/categories).
// Load after js/api.js on any page that shows categories:
//
//   const categories = await ApexCategories.load();
//   ApexCategories.fillSelect(selectEl, categories, {
//       placeholder: "Select Category...",   // first, empty option
//       value: "id"                          // or "slug" (default)
//   });
//
// Each category: { id, name, slug, icon, image, created_at }

(function () {

    let request = null; // one request per page, shared by all callers

    function load() {
        if (!request) {
            request = apiFetch("/api/categories", { auth: false })
                .catch(error => {
                    request = null; // allow a retry later
                    throw error;
                });
        }
        return request;
    }

    /** Bootstrap Icons class for a category ("bi bi-laptop"); falls back to a tag */
    function iconClass(category) {
        return "bi bi-" + (category && category.icon ? category.icon : "tag");
    }

    /**
     * Replaces a <select>'s options with the categories.
     * options.placeholder  text of a first option with value ""
     * options.allOption    text of a first option with value "all"
     * options.value        "slug" (default) or "id"
     * options.selected     value to select afterwards
     */
    function fillSelect(select, categories, options = {}) {
        if (!select) return;

        const valueKey = options.value || "slug";
        const selected = options.selected ?? select.value;

        select.replaceChildren();

        if (options.allOption) {
            select.append(new Option(options.allOption, "all"));
        }
        if (options.placeholder) {
            select.append(new Option(options.placeholder, ""));
        }

        categories.forEach(category => {
            select.append(new Option(category.name, String(category[valueKey])));
        });

        if (selected !== undefined && selected !== null) {
            select.value = String(selected);
        }
    }

    window.ApexCategories = { load, iconClass, fillSelect };

})();
