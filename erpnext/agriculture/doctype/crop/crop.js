// Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.provide("erpnext.crop");

function calculate_crop_cycle_qty(frm) {
	frappe.call({
		method: 'erpnext.agriculture.doctype.crop.crop.convert_time',
		args: {
			time_uom: frm.doc.uom_date,
			period_uom: frm.doc.date_uom_crop_cycle,
			duration_crop_cycle: frm.doc.duration_of_crop_cycle,
			crop_cycle_period: frm.doc.crop_cycle_period
		},
		callback: (r) => {
			// console.log(r.message);
			cur_frm.set_value('estimated_crop_cycles', r.message);
			refresh_field('estimated_crop_cycles');
		}
	});
}

frappe.ui.form.on('Crop', {
	refresh: (frm) => {
		// frm.fields_dict.materials_required.grid.set_column_disp('bom_no', false);
		frappe.call({
			method: "erpnext.agriculture.doctype.crop.crop.get_time_uom",
			callback: function (r) {
				let time_unit_array = r.message;
				frm.set_df_property("uom_date", "options", time_unit_array);
				frm.set_df_property("date_uom_crop_cycle", "options", time_unit_array);
			}
		});
	},
	uom_date: (frm) => {
		calculate_crop_cycle_qty(frm);
	},
	date_uom_crop_cycle: (frm) => {
		calculate_crop_cycle_qty(frm);
	}
});

// frappe.ui.form.on("BOM Item", {
// 	item_code: (frm, cdt, cdn) => {
// 		erpnext.crop.update_item_rate_uom(frm, cdt, cdn);
// 	},
// 	qty: (frm, cdt, cdn) => {
// 		erpnext.crop.update_item_qty_amount(frm, cdt, cdn);
// 	},
// 	rate: (frm, cdt, cdn) => {
// 		erpnext.crop.update_item_qty_amount(frm, cdt, cdn);
// 	}
// });

// erpnext.crop.update_item_rate_uom = function (frm, cdt, cdn) {
// 	let material_list = ['materials_required', 'produce', 'byproducts'];
// 	material_list.forEach((material) => {
// 		frm.doc[material].forEach((item, index) => {
// 			if (item.name == cdn && item.item_code) {
// 				frappe.call({
// 					method: 'erpnext.agriculture.doctype.crop.crop.get_item_details',
// 					args: {
// 						item_code: item.item_code
// 					},
// 					callback: (r) => {
// 						frappe.model.set_value('BOM Item', item.name, 'uom', r.message.uom);
// 						frappe.model.set_value('BOM Item', item.name, 'rate', r.message.rate);
// 					}
// 				});
// 			}
// 		});
// 	});
// };

// erpnext.crop.update_item_qty_amount = function (frm, cdt, cdn) {
// 	let material_list = ['materials_required', 'produce', 'byproducts'];
// 	material_list.forEach((material) => {
// 		frm.doc[material].forEach((item, index) => {
// 			if (item.name == cdn) {
// 				if (!frappe.model.get_value('BOM Item', item.name, 'qty'))
// 					frappe.model.set_value('BOM Item', item.name, 'qty', 1);
// 				frappe.model.set_value('BOM Item', item.name, 'amount', item.qty * item.rate);
// 			}
// 		});
// 	});
// };

