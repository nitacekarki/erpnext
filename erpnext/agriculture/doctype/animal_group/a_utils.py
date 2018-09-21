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
            animal_weights = frappe.db.get_values('Animal Weight',
                                                    filters={'animal_id': animal[i]['name']},
                                                    fieldname=['animal_id', 'date_of_measure',
                                                               'weight', 'weight_uom'], as_dict=1)

            animals_list.insert(i, animal_weights)

    return animals_list


@frappe.whitelist()
def serie_animals(animal_group_name):
    weight_list = []
    if frappe.db.exists('Animal', {'member_of_group': animal_group_name}):
        animal_serie = frappe.db.get_values('Animal',
                                            filters={'member_of_group': animal_group_name},
                                            fieldname=['name', 'animal_id_number'], as_dict=1)
        last_weight = animal_w(animal_serie)

        n_animal_w = len(last_weight)
        for i in range(0, n_animal_w):
            for x in range(0, (len(last_weight[i]))):
                frappe.msgprint(_('para indice ' + str(i) + ' ' + str(last_weight[i][x]['animal_id']) + ' ' + str(last_weight[i][x]['date_of_measure']) + ' ' + str(last_weight[i][x]['weight'])))
                # weight_list.append(str(last_weight[i][x]['date_of_measure']))
                # weight_list.append(str(last_weight[i][x]['weight']))
        frappe.msgprint(_(weight_list))
    else:
        return 0

# [
#     [
#         {u'animal_id': u'123456789', u'weight_uom': u'Pound', u'weight': u'540', u'date_of_measure': datetime.date(2018, 9, 22)},
#         {u'animal_id': u'123456789', u'weight_uom': u'Pound', u'weight': u'500', u'date_of_measure': datetime.date(2018, 9, 21)}
#     ],
#     [
#         {u'animal_id': u'124555', u'weight_uom': u'Pound', u'weight': u'650', u'date_of_measure': datetime.date(2018, 9, 21)}
#     ]
# ]