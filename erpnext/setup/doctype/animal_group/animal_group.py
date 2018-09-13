# -*- coding: utf-8 -*-
# Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
from frappe.utils.nestedset import NestedSet

class AnimalGroup(NestedSet):
	nsm_parent_field = 'parent_animal_group'
	
	def on_update(self):
		self.validate_name_with_animal()
		super(AnimalGroup, self).on_update()
		self.validate_one_root()

	def validate_name_with_animal(self):
		if frappe.db.exists('Animal', self.name):
			frappe.msgprint(_('A Animal with the same name already exists'), raise_exception=1)

def get_parent_animal_groups(animal_group):
	lft, rgt, = frappe.db.get_value('Animal Group', animal_group, ['lft', 'rgt'])

	return frappe.db.sql("""select identifier from `tabAnimal Group`
		where lft <= %s and rgt >= %s
		order by lft asc""", (lft, rgt), as_dict=True)

def on_doctype_update():
	frappe.db.add_index('Animal Group', ['lft', 'rgt'])
