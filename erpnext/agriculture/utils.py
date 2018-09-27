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
from erpnext.accounts.doctype.account.account import get_account_currency

@frappe.whitelist()
# This already requires a root to be named in the tree.js file for the doctype.
def get_children(doctype, parent, is_root=False):
	# from erpnext.accounts.report.financial_statements import sort_accounts

	parent_fieldname = 'parent_' + doctype.lower().replace(' ', '_')
	fields = [
		'name as value',
		'is_group as expandable'
	]
	filters = [['docstatus', '<', 2]]

	filters.append(['ifnull(`{0}`,"")'.format(parent_fieldname), '=', '' if is_root else parent])

	if is_root:
		fields += ['root_type', 'report_type', 'account_currency'] if doctype == 'Account' else []
		filters.append(['company', '=', company])

	else:
		fields += ['account_currency'] if doctype == 'Account' else []
		fields += [parent_fieldname + ' as parent']

	acc = frappe.get_list(doctype, fields=fields, filters=filters)

# Por aca va lo de los pesos!
	if doctype == 'Animal Group':
		sort_accounts(acc, is_root, key="value")
		company_currency = frappe.get_cached_value('Company',  company,  "default_currency")
		for each in acc:
			each["company_currency"] = company_currency
			each["balance"] = flt(get_balance_on(each.get("value"), in_account_currency=False))

			if each.account_currency != company_currency:
				each["balance_in_account_currency"] = flt(get_balance_on(each.get("value")))

	return acc

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
