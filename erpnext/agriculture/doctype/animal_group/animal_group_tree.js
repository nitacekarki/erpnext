frappe.provide("frappe.treeview_settings")

frappe.treeview_settings["Animal Group"] = {
	breadcrumbs: "Animal Group",
	title: __("Animal Group Tree View"),
	// Obtains the first or root doctype
	get_tree_root: true,

	ignore_fields: ["parent_animal_group"],
	// Preparing the tree view elements, this is enough to populate the list.  This must exist before ANY additions from other functions.
	onload: function (treeview) {
		frappe.treeview_settings['Animal Group'] = {
			ignore_fields: ["parent_animal_group"]
		};
		$.extend(frappe.treeview_settings['Animal Group'].page, treeview.page);
	},
	// Now that nodes already exist after loading, we can call the weight calculation function when rendering on the page.
	onrender: function (node) {
		calc_weight(node);
	},
}
// this function obtains the total weight of the animal
function calc_weight(node) {
	let page = $(document);
	if (!node.is_root) {
		// Here the weights are obtained from the total field weight.
		frappe.db.get_value("Animal Group", node.data.value, "total_group_weight")
			// This is frappe's shorthand callback function, talking to the server, obtaining the total_group_weight each group has assigned upon saving the doctype.
			// for the moment this cannot calculate the weight on the fly.
			.then((r) => {
				if (r.message.total_group_weight) {
					let x = page.find(`span[data-label="${node.data.value}"] .tree-label`);
					x.text(`${x.text()} (${(r.message.total_group_weight + ' Lb')})`).css('color', '#4F4F4F');
				}
			});

	}	
}
