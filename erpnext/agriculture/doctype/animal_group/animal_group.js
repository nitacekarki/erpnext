// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

// Check items in members to avoid duplicates
function find_item(frm, item) {
	var state_a = false;

	$.each(frm.doc.members || [], function (i, d) {
		if (d.animal_identifier === item) {
			state_a = true;
		}
	});

	return state_a;
}

function total_seralized_animal_weight(frm) {
	let animal_default_weight_uom = 0;

	frappe.call({
		method: "erpnext.agriculture.doctype.animal_group.a_utils.serie_animals",
		args: {
			animal_group_name: frm.doc.name
		},
		callback: function (r) {
			let animals = r.message;
			let total_serialized_weight = 0;

			if (animals != 0) {

				animals.forEach((animal, index) => {
					// Applies to serialized animals
					if (!find_item(frm, animal[0]['animal_id'])) {
						cur_frm.refresh_field("members");
						// new row creation
						const serie = frappe.model.add_child(cur_frm.doc, "Animal Group Member", "members");
						serie.animal_identifier = animal[0]['animal_id'];
						serie.last_weight = animal[0]['weight'];
						serie.weight_uom = animal[0]['weight_uom'];
						serie.member_type = animal[0]['member_type'];
						serie.animal_common_name = animal[0]['animal_identifier'];
						serie.member = '';

						cur_frm.refresh_field("members");
					}
				});

				// Obtain the default animal weight from livestock settings and convert if necessary
				frappe.call({
					method: "erpnext.agriculture.doctype.animal_group.a_utils.verify_default_weight",
					callback: function (r) {
						animal_default_weight_uom = r.message;

						frm.doc.members.forEach((member, i) => {
							let this_row_weight_uom = member.weight_uom

							if (this_row_weight_uom !== animal_default_weight_uom) {
								frappe.call({
									method: "erpnext.agriculture.doctype.animal_group.a_utils.convert",
									args: {
										from_uom: this_row_weight_uom,
										to_uom: animal_default_weight_uom
									},
									callback: function (r) {
										// assign the conversion factor from the server to a local variable
										var conv_factor = r.message[0]['value'];
										// add the converted weight to the total weight tally variable
										total_serialized_weight += flt(member.last_weight * conv_factor)
										// Finally, set the value of the field for total unserialized weight
										cur_frm.set_value('total_serialized_weight', total_serialized_weight);
										// console.log('Serialized Weight was converted' + (member.last_weight * conv_factor));
										cur_frm.refresh_field("total_serialized_weight");
										cur_frm.set_value('total_group_weight', (flt(cur_frm.doc.total_serialized_weight) + flt(cur_frm.doc.total_unserialized_weight)));
										cur_frm.refresh_fields('total_group_weight');
									}
								});

							} else {
								total_serialized_weight += flt(member.last_weight)
								cur_frm.set_value('total_serialized_weight', total_serialized_weight);
								cur_frm.refresh_field("total_serialized_weight");
								cur_frm.set_value('total_group_weight', (flt(cur_frm.doc.total_serialized_weight) + flt(cur_frm.doc.total_unserialized_weight)));
								cur_frm.refresh_fields('total_group_weight');
							}
						})
					}
				});
			}

		}
	});

}

function total_weight_non_serialized(frm) {
	let total_unserialized_weight = 0;
	var animal_default_weight_uom = 0;

	// Obtain the default animal weight from livestock settings.
	frappe.call({
		method: "erpnext.agriculture.doctype.animal_group.a_utils.verify_default_weight",
		callback: function (r) {
			animal_default_weight_uom = r.message;

			frm.doc.unserialized_group_members.forEach((m, i) => {
				let this_row_weight_uom = m.weight_uom;

				if (this_row_weight_uom !== animal_default_weight_uom) {
					frappe.call({
						method: "erpnext.agriculture.doctype.animal_group.a_utils.convert",
						args: {
							from_uom: this_row_weight_uom,
							to_uom: animal_default_weight_uom
						},
						callback: function (r) {
							// assign the conversion factor from the server to a local variable
							var conv_factor = r.message[0]['value'];
							// add the converted weight to the total weight tally variable
							total_unserialized_weight += flt((m.weight * conv_factor))
							// Finally, set the value of the field for total unserialized weight
							cur_frm.set_value('total_unserialized_weight', total_unserialized_weight);
							cur_frm.refresh_field("total_unserialized_weight");
							cur_frm.set_value('total_group_weight', (flt(cur_frm.doc.total_serialized_weight) + flt(cur_frm.doc.total_unserialized_weight)));
							cur_frm.refresh_fields('total_group_weight');
						}
					});

				} else {
					total_unserialized_weight += flt(m.weight)
					cur_frm.set_value('total_unserialized_weight', total_unserialized_weight);
					cur_frm.refresh_field("total_unserialized_weight");
					cur_frm.set_value('total_group_weight', (flt(cur_frm.doc.total_serialized_weight) + flt(cur_frm.doc.total_unserialized_weight)));
					cur_frm.refresh_fields('total_group_weight');
				}
			});
		}
	});

}

frappe.ui.form.on('Animal Group', {
	serialization: function (frm) {

		if (frm.doc.serialization === 'Fungible/ Unserialized') {
			total_weight_non_serialized(frm);
			cur_frm.clear_table('members');
			cur_frm.set_value('total_serialized_weight', '');
			cur_frm.refresh_fields();
		}

		if (frm.doc.serialization === 'Uniquely Identified/ Serialized') {
			total_seralized_animal_weight(frm);
			cur_frm.set_value('total_unserialized_weight', '');
			cur_frm.refresh_fields();
		}

		if (frm.doc.serialization === 'Mixed') {
			total_seralized_animal_weight(frm);
			total_weight_non_serialized(frm);
			cur_frm.refresh_fields();
		}

	},
	onload: function (frm) {
		// Verification of correct data when the document is loaded

		cur_frm.clear_table('members');
		cur_frm.refresh_fields();

		if (frm.doc.serialization === 'Fungible/ Unserialized') {
			total_weight_non_serialized(frm);
			cur_frm.clear_table('members');
			cur_frm.set_value('total_serialized_weight', '');
			cur_frm.refresh_fields();
		}

		if (frm.doc.serialization === 'Uniquely Identified/ Serialized') {
			total_seralized_animal_weight(frm);
			cur_frm.set_value('total_unserialized_weight', '');
			cur_frm.refresh_fields();
		}

		if (frm.doc.serialization === 'Mixed') {
			total_seralized_animal_weight(frm);
			total_weight_non_serialized(frm);
			cur_frm.refresh_fields();
		}

	},
	before_save: function (frm, cdt, cdn) {
		// Verification of correct data before saving

		cur_frm.clear_table('members');
		cur_frm.set_value('total_unserialized_weight', '');
		cur_frm.set_value('total_serialized_weight', '');
		cur_frm.set_value('total_group_weight', '');
		cur_frm.refresh_fields();

		if (frm.doc.serialization === 'Fungible/ Unserialized') {
			total_weight_non_serialized(frm);
			cur_frm.clear_table('members');
			cur_frm.set_value('total_serialized_weight', '');
			cur_frm.refresh_fields();
		}

		if (frm.doc.serialization === 'Uniquely Identified/ Serialized') {
			total_seralized_animal_weight(frm);
			cur_frm.set_value('total_unserialized_weight', '');
			cur_frm.refresh_fields();
		}

		if (frm.doc.serialization === 'Mixed') {
			total_seralized_animal_weight(frm);
			total_weight_non_serialized(frm);
			cur_frm.refresh_fields();
		}
	},
});

frappe.ui.form.on("Animal Group Member", {
	members_remove: function (frm, cdt, cdn) {
		total_seralized_animal_weight(frm);
		cur_frm.refresh_fields();
	}
});

frappe.ui.form.on("Unserialized Animal Group Member", {
	unserialized_group_members_add: function (frm, cdt, cdn) {
		total_weight_non_serialized(frm);
		cur_frm.refresh_fields();
	},
	unserialized_group_members_remove: function (frm, cdt, cdn) {
		total_weight_non_serialized(frm);
		cur_frm.refresh_fields();
	},
	weight: function (frm, cdt, cdn) {
		total_weight_non_serialized(frm);
		cur_frm.refresh_fields();
	},
	weight_uom: function (frm, cdt, cdn) {
		total_weight_non_serialized(frm);
		cur_frm.refresh_fields();
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
