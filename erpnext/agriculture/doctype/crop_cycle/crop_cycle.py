# -*- coding: utf-8 -*-
# Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import ast

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days, flt, getdate, get_url, now


class CropCycle(Document):
	def validate(self):
		self.set_missing_values()
		self.load_tasks()
		self.load_crop_inputs()
		self.load_crop_harvest_items()
		self.validate_dates()
		self.validate_creation()
	
	def onload(self):
		"""Load crop cycle tasks for quick view"""
		self.load_tasks()
		self.load_crop_inputs()
		self.load_crop_harvest_items()

	def after_insert(self):
		self.create_crop_cycle_tasks()
		self.create_tasks_for_diseases()

	def on_update(self):
		self.create_tasks_for_diseases()
		self.delete_task()
		self.load_tasks()
		self.load_crop_inputs()
		self.load_crop_harvest_items()

	def set_missing_values(self):
		crop = frappe.get_doc('Crop', self.crop)

		if not self.crop_spacing_uom:
			self.crop_spacing_uom = crop.crop_spacing_uom

		if not self.row_spacing_uom:
			self.row_spacing_uom = crop.row_spacing_uom

	def validate_dates(self):
		if self.start_date and self.end_date:
			if getdate(self.end_date) < getdate(self.start_date):
				frappe.throw(_("Expected End Date can not be less than Expected Start Date"))

	def validate_creation(self):
		for d in frappe.get_all('Crop Cycle',
			fields=['end_date', 'name'],
			filters={'docstatus': 1}):
			if (getdate(self.start_date) <= d.end_date):
				frappe.throw(_('''There is already a crop cycle <a href= "#Form/Crop Cycle/{0}"><b>{0}</b></a>
				 				within the selected date range, please add one more day to the start date.''').format(d.name))

	def create_crop_cycle_tasks(self):
		crop = frappe.get_doc('Crop', self.crop)
		self.create_task(crop.agriculture_task, self.title, self.start_date)

	def create_tasks_for_diseases(self):
		for disease in self.detected_disease:
			if not disease.tasks_created:
				self.import_disease_tasks(disease.disease, disease.start_date)
				disease.tasks_created = True

				frappe.msgprint(_("Tasks have been created for managing the {0} disease (on row {1})".format(disease.disease, disease.idx)))

	def import_disease_tasks(self, disease, start_date):
		disease_doc = frappe.get_doc('Disease', disease)
		self.create_task(disease_doc.treatment_task, self.name, start_date)

	def create_task(self, crop_tasks, crop_cycle_name, start_date):
		for crop_task in crop_tasks:
			task = frappe.new_doc("Task")
			task.update({
				"subject": crop_task.get("task_name"),
				"priority": crop_task.get("priority"),
				"crop_cycle": crop_cycle_name,
				"exp_start_date": add_days(start_date, crop_task.get("start_day")),
				"exp_end_date": add_days(start_date, crop_task.get("end_day"))
			})
			task.insert()

	def load_tasks(self):
		"""Load `tasks` from the database"""
		self.tasks = []
		for task in self.get_tasks():
			task_map = {
				"title": task.subject,
				"status": task.status,
				"start_date": task.exp_start_date,
				"end_date": task.exp_end_date,
				"description": task.description,
				"task_id": task.name,
				"task_weight": task.task_weight
			}

			self.append("tasks", task_map)

	def get_tasks(self):
		if self.name is None:
			return {}
		else:
			filters = {"crop_cycle": self.name}

			if self.get("deleted_task_list"):
				filters.update({
					'name': ("not in", self.deleted_task_list)
				})

			return frappe.get_all("Task", "*", filters, order_by="exp_start_date asc")

	def load_crop_inputs(self):
		"""Load `crop inputs` from the database"""
		self.crop_cycle_input_items = []
		for crop_input in self.get_crop_inputs():
			crop_inputs_map = {
				"item_code": crop_input.item_code,
				"item_name": crop_input.item_name,
				"qty": crop_input.qty,
				"uom": crop_input.uom,
				"expected_harvest_date": add_days(self.start_date, crop_input.expected_harvest_start),
				"expected_harvest_viability_date": add_days(self.start_date, crop_input.expected_harvest_end)
			}

			self.append("crop_cycle_input_items", crop_inputs_map)

	def get_crop_inputs(self):
		if self.crop is None:
			return {}
		else:
			filters = {"parent": self.crop}

			# if self.get("deleted_task_list"):
			# 	filters.update({
			# 		'name': ("not in", self.deleted_task_list)
			# 	})

			return frappe.get_all("Crop Input Item", "*", filters, order_by="expected_harvest_start asc")

	def load_crop_harvest_items(self):
		"""Load `crop harvest items` from the database"""
		self.crop_harvest_item_viability_window = []
		for crop_harvest_item in self.get_crop_harvest_items():
			crop_harvest_items_map = {
				"item_code": crop_harvest_item.item_code_harvest,
				"item_name": crop_harvest_item.item_name_harvest,
				"qty": crop_harvest_item.qty,
				"uom": crop_harvest_item.uom,
				"expected_harvest_date": add_days(self.start_date, crop_harvest_item.expected_harvest_start),
				"expected_harvest_viability_date": add_days(self.start_date, crop_harvest_item.expected_harvest_end)
			}

			self.append("crop_harvest_item_viability_window", crop_harvest_items_map)

	def get_crop_harvest_items(self):
		if self.crop is None:
			return {}
		else:
			filters = {"parent": self.crop}

			# if self.get("deleted_task_list"):
			# 	filters.update({
			# 		'name': ("not in", self.deleted_task_list)
			# 	})

			return frappe.get_all("Crop Harvest Item", "*", filters, order_by="expected_harvest_start asc")

	def delete_task(self):
		if not self.get('deleted_task_list'): return

		for d in self.get('deleted_task_list'):
			frappe.delete_doc("Task", d)

		self.deleted_task_list = []

	def reload_linked_analysis(self):
		linked_doctypes = ['Soil Texture', 'Soil Analysis', 'Plant Analysis']
		required_fields = ['location', 'name', 'collection_datetime']
		output = {}

		for doctype in linked_doctypes:
			output[doctype] = frappe.get_all(doctype, fields=required_fields)

		output['Location'] = []

		for location in self.linked_location:
			output['Location'].append(frappe.get_doc('Location', location.location))

		frappe.publish_realtime("List of Linked Docs",
								output, user=frappe.session.user)

	def append_to_child(self, obj_to_append):
		for doctype in obj_to_append:
			for doc_name in set(obj_to_append[doctype]):
				self.append(doctype, {doctype: doc_name})

		self.save()


def get_coordinates(doc):
	return ast.literal_eval(doc.location).get('features')[0].get('geometry').get('coordinates')


def get_geometry_type(doc):
	return ast.literal_eval(doc.location).get('features')[0].get('geometry').get('type')


def is_in_location(point, vs):
	x, y = point
	inside = False

	j = len(vs) - 1
	i = 0

	while i < len(vs):
		xi, yi = vs[i]
		xj, yj = vs[j]

		intersect = ((yi > y) != (yj > y)) and (
			x < (xj - xi) * (y - yi) / (yj - yi) + xi)

		if intersect:
			inside = not inside

		i = j
		j += 1

	return inside

@frappe.whitelist()
def create_kanban_board_if_not_exists(crop_cycle):
	from frappe.desk.doctype.kanban_board.kanban_board import quick_kanban_board

	if not frappe.db.exists('Kanban Board', crop_cycle):
		quick_kanban_board('Task', crop_cycle, 'status')

	return True
