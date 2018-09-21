// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Animal Group', {
	refresh: function (frm) {
		frappe.call({
			method: "erpnext.agriculture.doctype.animal_group.a_utils.serie_animals",
			args: {
				animal_group_name: frm.doc.name
			},
			callback: function (r) {
				let animals = r.message;

				if (animals != 0) {
					animals.forEach((animal, index) => {
						if (animal.animal_id_number) {
							const serie = frappe.model.add_child(cur_frm.doc, "Animal Group Member", "members");
							serie.animal_identifier = animal.name;
							serie.animal_type = animal.animal_type;
							serie.animal_id_number = animal.animal_id_number;
							serie.animal_status = animal.animal_status;

							cur_frm.refresh_field("serialized_animals");
						} else {
							const no_serie = frappe.model.add_child(cur_frm.doc, "Unserialized Animal Group Member", "unserialized_group_members");
							no_serie.animal_identifier = animal.name;
							no_serie.animal_type = animal.animal_type;
							no_serie.animal_id_number = '';
							no_serie.animal_status = animal.animal_status;

							cur_frm.refresh_field("not_animals_serialized");
						}
					});
				}

			}
		});
	}
});

cur_frm.cscript.refresh = function (doc, cdt, cdn) {
	cur_frm.cscript.set_root_readonly(doc);
}

cur_frm.cscript.set_root_readonly = function (doc) {
	// Read only for root animal group
	if (!doc.parent_animal_group) {
		cur_frm.set_read_only();
		cur_frm.set_intro(__('This is a root Animal Group and cannot be edited.'));
	} else {
		cur_frm.set_intro(null);
	}
}

//  Get Query select Animal Group
cur_frm.fields_dict['parent_animal_group'].get_query = function (doc, cdt, cdn) {
	return {
		filters: {
			'is_group': 1
		}
	}
}
