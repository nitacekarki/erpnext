// Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

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

frappe.ui.form.on('Animal Group', {
	serialization: function (frm) {
		frappe.call({
			method: "erpnext.agriculture.doctype.animal_group.a_utils.serie_animals",
			args: {
				animal_group_name: frm.doc.name
			},
			callback: function (r) {
				let animals = r.message;
				let total_weight = 0;

				if (animals != 0) {
					//  Recorre animal por animal
					animals.forEach((animal, index) => {
						// Si el animal consultado no existe en la tabla hija members se procede a agregar uno nuevo
						// APLICA PARA ANIMALES SERIALIZADOS
						if (!find_item(frm, animal[0]['animal_id'])) {
							// Creacion nueva fila con sus respectivas propiedades
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
				}
				//  Totaliza el total de peso para animales serializados
				frm.doc.members.forEach((member, i) => {
					total_weight += flt(member.last_weight)
				});

				cur_frm.set_value('total_serialized_weight', total_weight);

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
