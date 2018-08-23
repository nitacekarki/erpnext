frappe.listview_settings['Agricultural Work'] = {
	get_indicator: function (doc) {
		if (doc.status === 'Active') {

			return [__("Active"), "orange"];

		}
		else if (doc.status === 'Scheduled') {

			return [__("Scheduled"), "blue"];

		} else if (doc.status === 'Completed') {

			return [__("Completed"), "green"];

		}
	}
};