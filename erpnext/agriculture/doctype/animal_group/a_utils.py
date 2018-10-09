# -*- coding: utf-8 -*-
# Copyright (c) 2018, Frappe Technologies Pvt. Ltd. and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe import _
import datetime

def animal_w(animal):
    n_animals = len(animal)
    animals_list = []

    for i in range(0, n_animals):
        if frappe.db.exists('Animal Weight', {'animal_id': animal[i]['name']}):
            # Get weight record according to the last date
            date_animal = frappe.db.sql('''SELECT `animal_id`, `weight`, `weight_uom`,
                                           `date_of_measure`, `member_type`, `animal_identifier` 
                                           FROM `tabAnimal Weight`
                                           WHERE `animal_id`=%(a_id)s
                                           ORDER BY `date_of_measure` 
                                           DESC LIMIT 1;''', {'a_id': animal[i]['name']}, as_dict=True)

            animals_list.insert(i, date_animal)

    return animals_list


@frappe.whitelist()
def serie_animals(animal_group_name):
    weight_list = []
    if frappe.db.exists('Animal', {'member_of_group': animal_group_name}):
        animal_serie = frappe.db.get_values('Animal',
                                            filters={'member_of_group': animal_group_name},
                                            fieldname=['name', 'animal_id_number'], as_dict=1)
        # Keeps animals with a weight record according to the latest date
        animal_list_with_last_weight = animal_w(animal_serie)

        return animal_list_with_last_weight
    else:
        return 0

@frappe.whitelist()
def verify_default_weight():
    try:
        uom = frappe.db.get_single_value('Livestock Settings','animal_default_weight_uom')
    except:
        frappe.msgprint(_('Please set the default animal weight UOM in <a href= "#Form/Livestock Settings/">Livestock Settings</a>'))
    else:
        return uom

@frappe.whitelist()
def convert(from_uom, to_uom):
    if frappe.db.exists('UOM Conversion Factor', {'from_uom': 'Kg', 'to_uom': 'Pound'}):
        conversion_factor = frappe.db.get_values('UOM Conversion Factor',
                                            filters={'from_uom': from_uom, 'to_uom': to_uom},
                                            fieldname=['value'], as_dict=True)

        return conversion_factor
    else:
        frappe.msgprint(_('Please create the conversion in <a href= "#Form/UOM Conversion Factor/">UOM Conversion Factor</a>'))
