# -*- coding: utf-8 -*-
# Copyright (c) 2017, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals

import frappe
from frappe import _
from frappe.model.document import Document


class Crop(Document):
	def validate(self):
		self.validate_crop_tasks()

	def validate_crop_tasks(self):
		pass
		# TODO: REINTEGRAR ESTE CODIGO
		# for task in self.agriculture_task:
		# 	if task.start_day > task.end_day:
		# 		frappe.throw(_("Start day is greater than end day in task '{0}'").format(task.task_name))

		# # Verify that the crop period is correct
		# max_crop_period = max([task.end_day for task in self.agriculture_task])
		# self.period = max(self.period, max_crop_period)

		# # Sort the crop tasks based on start days,
		# # maintaining the order for same-day tasks
		# self.agriculture_task.sort(key=lambda task: task.start_day)


@frappe.whitelist()
def get_item_details(item_code):
	item = frappe.get_doc('Item', item_code)
	return {"uom": item.stock_uom, "rate": item.valuation_rate}

@frappe.whitelist()
def get_time_uom():
	prueba_data = frappe.db.get_values('UOM Conversion Factor',
										filters={'category': 'Time'},
										fieldname=['to_uom'])

	# naming_series = frappe.get_meta("UOM Conversion Factor").get_field("to").options or ""
	# prueba_data = prueba_data.split("\n")

	return sorted(set(prueba_data))

@frappe.whitelist()
def convert_time(time_uom, period_uom, duration_crop_cycle, crop_cycle_period):

	crop_cycle_duration_data = frappe.db.get_values('UOM Conversion Factor',
									filters={'category': 'Time', 'to_uom': time_uom},
									fieldname=['value', 'from_uom'], as_dict=True)

	crop_cycle_period_data = frappe.db.get_values('UOM Conversion Factor',
										filters={'category': 'Time', 'to_uom': period_uom},
										fieldname=['value', 'from_uom'], as_dict=True)

	if crop_cycle_duration_data[0]['from_uom']=='Second':
		#If the conversion factor is to seconds, then execute the conversion.

		crop_cycle_duration_seconds = float(duration_crop_cycle) / crop_cycle_duration_data[0]['value']
		#frappe.msgprint(_("Crop Cycle duration in seconds: " + str(crop_cycle_duration_seconds)))

		if crop_cycle_period_data[0]['from_uom']=='Second':
			#crop_cycle_duration_seconds = float(duration_crop_cycle) * period_uom[0]['value']
			crop_cycle_period_seconds = float(crop_cycle_period) / crop_cycle_period_data[0]['value']
			#frappe.msgprint(_("Crop Cycle period in seconds: " + str(crop_cycle_period_seconds)))

			number_of_crop_cycles = crop_cycle_duration_seconds / crop_cycle_period_seconds
			#frappe.msgprint(_("Number of crop cycles should be " + str(number_of_crop_cycles)))
			
		else:
			frappe.msgprint(_("Please add a conversion to seconds in UOM Conversion Factor for " + crop_cycle_period_data[0]['from_uom']))
	else:
		frappe.msgprint(_("Please add a conversion to seconds in UOM Conversion Factor " + crop_cycle_duration_data[0]['from_uom']))

	return number_of_crop_cycles