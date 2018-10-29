# -*- coding: utf-8 -*-
# Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import ast

import frappe
from frappe import _
from frappe.model.document import Document
from frappe.utils import add_days


class CropCycle(Document):
	def validate(self):
		self.set_missing_values()
		self.load_tasks()
	
	def onload(self):
		"""Load project tasks for quick view"""
		if not self.get('__unsaved') and not self.get("tasks"):
			self.load_tasks()

	def after_insert(self):
		self.create_crop_cycle_project()
		self.create_tasks_for_diseases()

	def on_update(self):
		self.create_tasks_for_diseases()

	def set_missing_values(self):
		crop = frappe.get_doc('Crop', self.crop)

		if not self.crop_spacing_uom:
			self.crop_spacing_uom = crop.crop_spacing_uom

		if not self.row_spacing_uom:
			self.row_spacing_uom = crop.row_spacing_uom

	def create_crop_cycle_project(self):
		crop = frappe.get_doc('Crop', self.crop)

		# self.project = self.create_project(crop.period, crop.agriculture_task)
		# self.create_task(crop.agriculture_task, self.project, self.start_date)
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

	def create_project(self, period, crop_tasks):
		project = frappe.new_doc("Project")
		project.update({
			"project_name": self.title,
			"expected_start_date": self.start_date,
			"expected_end_date": add_days(self.start_date, period - 1)
		})
		project.insert()

		return project.name

	def create_task(self, crop_tasks, project_name, start_date):
		for crop_task in crop_tasks:
			task = frappe.new_doc("Task")
			task.update({
				"subject": crop_task.get("task_name"),
				"priority": crop_task.get("priority"),
				"crop_cycle": project_name,
				"exp_start_date": add_days(start_date, crop_task.get("start_day") - 1),
				"exp_end_date": add_days(start_date, crop_task.get("end_day") - 1)
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
