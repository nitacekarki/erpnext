frappe.provide("frappe.treeview_settings")

frappe.treeview_settings["Animal Group"] = {
	breadcrumbs: "Animal Group",
	title: __("Animal Group Tree View"),
	// Obtains the first or root doctype
	get_tree_root: true, //  Should it be "All Animals"?

	ignore_fields: ["parent_animal_group"],
	onload: function (treeview) {
		frappe.treeview_settings['Animal Group'] = {
			ignore_fields: ["parent_animal_group"]
		};
		$.extend(frappe.treeview_settings['Animal Group'].page, treeview.page);
	},
	onrender: function (node) {
		// Para cada elemento del arbol, se hace un evento de render.
		// Esto lo descubrimos porque tiene dos elementos, y por lo tanto corre dos veces esta funcion.
		// console.log('Se hizo un render');
		//console.log(cur_page);
		let page = $(document);
		// Evalue, si el nodo NO ES RAIZ.  Porque lo que esta adentro servira para todos los otros nodos.
		if (!node.is_root) {
			// Obteniento el valor de los campos deseados por CADA uno de los nodos a la hora de hacer render.
			//luego el arrow function abrevia y corre un validador, el cual , en caso de obtener el peso serializado
			// hace un console.log. y luego busca el objeto que contiene el valor de este nodo en el objeto de la pagina, y finalmente le agrega el texto.//#endregion
			// y esto SUPUESTAMENTE logra hacer que se coloque texto ADICIONAL con el nombre de el Nodo/folder.
			// console.log('Se obtuvo valor del DB');
			frappe.db.get_value("Animal Group", node.data.value, "total_group_weight")
				.then((r) => {
					if (r.message.total_group_weight) {
						// Aqui se SUMA los pesos totales del Grupo.
						let x = page.find(`span[data-label="${node.data.value}"] .tree-label`);
						x.text(`${x.text()} (${(r.message.total_group_weight + ' Lb')})`).css('color', '#4F4F4F');
					}
				});
		}
	},
}