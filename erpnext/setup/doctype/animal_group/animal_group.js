// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on("Animal Group", {
	onload: function (frm) { }
});

// cur_frm.cscript.refresh = function (doc, cdt, cdn) {
// 	cur_frm.cscript.set_root_readonly(doc);
// }

// cur_frm.cscript.set_root_readonly = function (doc) {
// 	// Read only for root customer group
// 	if (!doc.parent_animal_group) {
// 		cur_frm.set_read_only();
// 		cur_frm.set_intro(__('This is a root Animal Group and cannot be edited.'));
// 	} else {
// 		cur_frm.set_intro(null);
// 	}
// }

// //  Get Query select Animal Group
// cur_frm.fields_dict['parent_animal_group'].get_query = function (doc, cdt, cdn) {
// 	return {
// 		filters: {
// 			'is_group': 1
// 		}
// 	}
// }
