from frappe import _

def get_data():
	return {
		'heatmap': True,
		'heatmap_message': _('This is based on the Time Sheets created against this Crop Cycle'),
		# 'fieldname': 'crop_cycle', # Este campo debe existir en todas las transacciones como link field con el mismo nombre, para que desde el dashboard se puede referir a los demas
		'transactions': [
			{
				'label': _('Crop Cycle'),
				'items': ['Task'] # , 'Timesheet', 'Expense Claim', 'Issue' , 'Project Update']
			},
			{
				'label': _('Material'),
				'items': ['Stock Entry'] # , 'Material Request', 'BOM']
			},
			{
				'label': _('Sales'),
				'items': ['Sales Order', 'Delivery Note', 'Sales Invoice']
			},
			{
				'label': _('Purchase'),
				'items': ['Purchase Order', 'Purchase Receipt', 'Purchase Invoice']
			},
		]
	}
