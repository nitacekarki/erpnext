# -*- coding: utf-8 -*-
# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import unicode_literals

import frappe, erpnext
import frappe.defaults
from frappe.utils import nowdate, cstr, flt, cint, now, getdate
from frappe import throw, _
from frappe.utils import formatdate, get_number_format_info
from six import iteritems
# imported to enable erpnext.accounts.utils.get_account_currency
# from erpnext.accounts.doctype.account.account import get_account_currency

# Copyright (c) 2015, Revant. and Contributors
# License: GNU General Public License v3. See license.txt

from __future__ import unicode_literals
import frappe


# @frappe.whitelist()
# def get_children():
# 	ctype = frappe.local.form_dict.get('ctype')
# 	parent_field = 'parent_' + ctype.lower().replace(' ', '_')
# 	parent = frappe.form_dict.get("parent_animal_group") or ""

# 	return frappe.db.sql("""select name as value,
# 		if(is_group='Yes', 1, 0) as expandable
# 		from `tab{ctype}`
# 		where docstatus < 2
# 		and ifnull(`{parent_field}`,'') = %s
# 		order by name""".format(ctype=frappe.db.escape(ctype), parent_field=frappe.db.escape(parent_field)),
# 		parent, as_dict=1)

@frappe.whitelist()
def add_node():
	ctype = frappe.form_dict.get('ctype')
	parent_field = 'parent_' + ctype.lower().replace(' ', '_')
	name_field = ctype.lower().replace(' ', '_') + '_name'

	doc = frappe.new_doc(ctype)
	doc.update({
		name_field: frappe.form_dict['name_field'],
		parent_field: frappe.form_dict['parent'],
		"is_group": frappe.form_dict['is_group']
	})

	doc.save()


# @frappe.whitelist()
# # This already requires a root to be named in the tree.js file for the doctype.
# def get_children(doctype, parent, is_root=False):
# 	# from erpnext.accounts.report.financial_statements import sort_accounts

# 	parent_fieldname = 'parent_' + doctype.lower().replace(' ', '_')
# 	fields = [
# 		'name as value',
# 		'is_group as expandable'
# 	]
# 	filters = [['docstatus', '<', 2]]

# 	filters.append(['ifnull(`{0}`,"")'.format(parent_fieldname), '=', '' if is_root else parent])

# 	if is_root:
# 		fields += ['root_type', 'report_type', 'account_currency'] if doctype == 'Account' else []
# 		filters.append(['company', '=', company])

# 	else:
# 		fields += ['account_currency'] if doctype == 'Account' else []
# 		fields += [parent_fieldname + ' as parent']

# 	acc = frappe.get_list(doctype, fields=fields, filters=filters)

# # Por aca va lo de los pesos!
# # para cada item en la lista, obtiene la "moneda"
# 	if doctype == 'Animal Group':
# 		sort_accounts(acc, is_root, key="value")
# 		company_currency = frappe.get_cached_value('Company',  company,  "default_currency")
# 		# Aqui se hace la iteracion para popular los valores de la lista de arbol.
# 		for each in acc:
# 			each["company_currency"] = company_currency
# 			each["balance"] = flt(get_balance_on(each.get("value"), in_account_currency=False))

# 			if each.account_currency != company_currency:
# 				each["balance_in_account_currency"] = flt(get_balance_on(each.get("value")))

# 	return acc

# @frappe.whitelist()
# def add_ac(args=None):
# 	from frappe.desk.treeview import make_tree_args

# 	if not args:
# 		args = frappe.local.form_dict

# 	args.doctype = "Account"
# 	args = make_tree_args(**args)

# 	ac = frappe.new_doc("Account")

# 	if args.get("ignore_permissions"):
# 		ac.flags.ignore_permissions = True
# 		args.pop("ignore_permissions")

# 	ac.update(args)

# 	if not ac.parent_account:
# 		ac.parent_account = args.get("parent")

# 	ac.old_parent = ""
# 	ac.freeze_account = "No"
# 	if cint(ac.get("is_root")):
# 		ac.parent_account = None
# 		ac.flags.ignore_mandatory = True

# 	ac.insert()

# 	return ac.name
