frappe.provide("frappe.treeview_settings")

frappe.treeview_settings["Animal Group"] = {
	breadcrumbs: "Animal Group",
	title: __("Animal Group Tree View"),
	// Obtains the first or root doctype
	get_tree_root: true,

	ignore_fields: ["parent_animal_group"],
	onload: function (treeview) {
		frappe.treeview_settings['Animal Group'] = {
			ignore_fields: ["parent_animal_group"]
		};
		$.extend(frappe.treeview_settings['Animal Group'].page, treeview.page);
	},
	onrender: function (node) {
		let page = $(document);
		if (!node.is_root) {

			frappe.db.get_value("Animal Group", node.data.value, "total_group_weight")
				.then((r) => {
					if (r.message.total_group_weight) {
						let x = page.find(`span[data-label="${node.data.value}"] .tree-label`);
						x.text(`${x.text()} (${(r.message.total_group_weight + ' Lb')})`).css('color', '#4F4F4F');
					}
				});

		}
	},
}