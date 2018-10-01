// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

function total(frm) {
	//cur_frm.set_value('total_group_weight', flt(frm.doc.total_serialized_weight + frm.doc.total_unserialized_weight));		
}
// Funcion para verificar item en member y asi evitar duplicados
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
	var animal_default_weight_uom = 0;

	frappe.call({
		method: "erpnext.agriculture.doctype.animal_group.a_utils.serie_animals",
		args: {
			animal_group_name: frm.doc.name
		},
		callback: function (r) {
			let animals = r.message;
			let total_serialized_weight = 0;

			if (animals != 0) {
				//  Recorre animal por animal
				animals.forEach((animal, index) => {
					// Si el animal consultado no existe en la tabla hija members se procede a agregar uno nuevo
					// APLICA PARA ANIMALES SERIALIZADOS
					if (!find_item(frm, animal[0]['animal_id'])) {
						// Creacion nueva fila con sus respectivas propiedades
						cur_frm.refresh_field("members");
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
						// cur_frm.set_value('total_weight_uom_serialized', animal_default_weight_uom);
						//console.log(animal_default_weight_uom);
						// console.log('Serialized verification function > animal default weight:' + animal_default_weight_uom);

						//  Totaliza el total de peso para animales serializados
						frm.doc.members.forEach((member, i) => {
							let this_row_weight_uom = member.weight_uom
							// Comparar si la unidad de esta fila es igual a la uom de setting
							//console.log('Serialized weight UOM this row:' + this_row_weight_uom);
							if (this_row_weight_uom !== animal_default_weight_uom) {
								//  1. Si la unidad de peso esta fila  no es igual a la unidad de peso default
								// Convierta
								frappe.call({
									method: "erpnext.agriculture.doctype.animal_group.a_utils.convert",
									args: {
										from_uom: this_row_weight_uom,
										to_uom: animal_default_weight_uom
									},
									callback: function (r) {
										// assign the conversion factor from the server to a local variable
										var conv_factor = r.message[0]['value'];
										//console.log('Serialized Weight was converted' + (member.last_weight * conv_factor));
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
								// 2. Caso contrario, la unidad es igual, solo tome el numero para la suma.
								total_serialized_weight += flt(member.last_weight)
								//console.log('Serialized Weight was added' + (member.last_weight));
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
			// cur_frm.set_value('total_weight_uom', animal_default_weight_uom);
			frm.doc.unserialized_group_members.forEach((m, i) => {
				let this_row_weight_uom = m.weight_uom;
				// Comparar si la unidad de esta fila es igual a la uom de setting
				// console.log('Unserialized weight UOM this row:' + this_row_weight_uom);
				//console.log('unidad de peso default:' + animal_default_weight_uom);
				if (this_row_weight_uom !== animal_default_weight_uom) {
					//  1. Si la unidad de peso esta fila  no es igual a la unidad de peso default
					// Convierta
					frappe.call({
						method: "erpnext.agriculture.doctype.animal_group.a_utils.convert",
						args: {
							from_uom: this_row_weight_uom,
							to_uom: animal_default_weight_uom
						},
						callback: function (r) {
							// assign the conversion factor from the server to a local variable
							var conv_factor = r.message[0]['value'];
							// console.log(m.weight * conv_factor);
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
					// 2. Caso contrario, la unidad es igual, solo tome el numero para la suma.
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

	}
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
