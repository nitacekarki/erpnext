// Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
// For license information, please see license.txt

frappe.ui.form.on('Crop Cycle', {
	refresh: (frm) => {
		if (!frm.doc.__islocal)
			frm.add_custom_button(__('Reload Linked Analysis'), () => frm.call("reload_linked_analysis"));

		frappe.realtime.on("List of Linked Docs", (output) => {
			let analysis_doctypes = ['Soil Texture', 'Plant Analysis', 'Soil Analysis'];
			let analysis_doctypes_docs = ['soil_texture', 'plant_analysis', 'soil_analysis'];
			let obj_to_append = { soil_analysis: [], soil_texture: [], plant_analysis: [] };
			output['Location'].forEach((land_doc) => {
				analysis_doctypes.forEach((doctype) => {
					output[doctype].forEach((analysis_doc) => {
						let point_to_be_tested = JSON.parse(analysis_doc.location).features[0].geometry.coordinates;
						let poly_of_land = JSON.parse(land_doc.location).features[0].geometry.coordinates[0];
						if (is_in_land_unit(point_to_be_tested, poly_of_land)) {
							obj_to_append[analysis_doctypes_docs[analysis_doctypes.indexOf(doctype)]].push(analysis_doc.name);
						}
					});
				});
			});
			frm.call('append_to_child', {
				obj_to_append: obj_to_append
			});
		});

		if (frappe.model.can_read("Task")) {
			frm.add_custom_button(__("Gantt Chart"), function () {
				frappe.route_options = {
					"crop_cycle": frm.doc.name
				};
				frappe.set_route("List", "Task", "Gantt");
			});

			frm.add_custom_button(__("Kanban Board"), () => {
				frappe.call('erpnext.agriculture.doctype.crop_cycle.crop_cycle.create_kanban_board_if_not_exists', {
					crop_cycle: frm.doc.name
				}).then(() => {
					frappe.set_route('List', 'Task', 'Kanban', frm.doc.name);
				});
			});
		}

	},
	tasks_refresh: function (frm) {
		var grid = frm.get_field('tasks').grid;
		grid.wrapper.find('select[data-fieldname="status"]').each(function () {
			if ($(this).val() === 'Open') {
				$(this).addClass('input-indicator-open');
			} else {
				$(this).removeClass('input-indicator-open');
			}
		});
	}
});

frappe.ui.form.on("Crop Cycle Task", {
	edit_task: function (frm, doctype, name) {
		var doc = frappe.get_doc(doctype, name);
		if (doc.task_id) {
			frappe.set_route("Form", "Task", doc.task_id);
		} else {
			frappe.msgprint(__("Save the document first."));
		}
	},

	edit_timesheet: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		frappe.route_options = { "crop_cycle": frm.doc.name, "task": child.task_id };
		frappe.set_route("List", "Timesheet");
	},

	make_timesheet: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		frappe.model.with_doctype('Timesheet', function () {
			var doc = frappe.model.get_new_doc('Timesheet');
			var row = frappe.model.add_child(doc, 'time_logs');
			row.crop_cycle = frm.doc.name;
			row.task = child.task_id;
			frappe.set_route('Form', doc.doctype, doc.name);
		})
	},

	status: function (frm, doctype, name) {
		frm.trigger('tasks_refresh');
	},
});

frappe.ui.form.on("Crop Cycle Harvest Item", {
	view_stock_entry: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		frappe.route_options = { "crop_cycle": frm.doc.name };
		frappe.set_route("List", "Stock Entry");
	},
	make_stock_entry: function (frm, cdt, cdn) {
		var child = locals[cdt][cdn];
		frappe.model.with_doctype('Stock Entry', function () {
			var doc = frappe.model.get_new_doc('Stock Entry');
			doc.crop_cycle = frm.doc.name;
			var row = frappe.model.add_child(doc, 'items');
			row.item_code = child.item_code;
			row.qty = child.qty;
			row.uom = child.uom;
			frappe.set_route('Form', doc.doctype, doc.name);
		})
	}
});

function is_in_land_unit(point, vs) {
	// ray-casting algorithm based on
	// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

	var x = point[0], y = point[1];

	var inside = false;
	for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
		var xi = vs[i][0], yi = vs[i][1];
		var xj = vs[j][0], yj = vs[j][1];

		var intersect = ((yi > y) != (yj > y))
			&& (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
		if (intersect) inside = !inside;
	}

	return inside;
};
