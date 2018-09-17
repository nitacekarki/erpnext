# -*- coding: utf-8 -*-
# Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _

@frappe.whitelist()
def serie_animals(animal_group_name):
    if frappe.db.exists('Animal', {'member_of_group': animal_group_name}):
        animal_serie = frappe.db.get_values('Animal',
                                            filters={'member_of_group': animal_group_name},
                                            fieldname=['name', 'animal_type', 'animal_id_number',
                                                       'animal_status'], as_dict=1)

        return animal_serie
    else:
        return 0
