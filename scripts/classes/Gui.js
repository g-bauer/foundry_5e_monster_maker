import { DEFAULT_GUI } from "../consts/DefaultGui.js";

const Gui = (function() {

    function activateListeners(html) {
        html.find('.gg5e-mm-accordion .accordion-section__header').click((e) => _toggleAccordionCollapse(e));
		html.find('.gg5e-mm-panel.panel--collapsible .panel__header').click((e) => _togglePanelCollapse(e));
		html.find('button.move-up').click((e) => _moveUp(e));
		html.find('button.move-down').click((e) => _moveDown(e));
		html.find('button[data-action="open-modal"]').click((e) => _openModal(e));
		html.find('button[data-action="close-modal"]').click((e) => closeModal(e));
    }

	function setAccordions(html, accordions) {
		if (accordions) {
			for (const [key, value] of Object.entries(accordions)) {
				let accordion = html.find(`#${key.replace("_", "-")}`);
				value.split(",").forEach((x) => accordion.find(`[data-section='${x.trim()}']`).addClass("opened"));
			}
		}
	}

	function setPanels(html, panels) {
		if (panels) {
			for (const [key, value] of Object.entries(panels)) {
				if (value === "closed") {
					html.find(`#${key.replace("_", "-")}`).addClass("closed");
				}
			}
		}
	}

	function setScrollbars(html, scrollbars) {
		if (scrollbars) {
			for (const [key, value] of Object.entries(scrollbars)) {
				html.find(`#${key.replace("_", "-")}`).scrollLeft(value.x);
				html.find(`#${key.replace("_", "-")}`).scrollTop(value.y);
			}
		}
	}

	function prepareGui(...data) {
		return $.extend(true, {}, DEFAULT_GUI, ...data);
	}

	async function preloadHandlebarsTemplates() {

		return loadTemplates([
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/ability_ranking.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/condition_immunity.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/damage_immunity.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/damage_resistance.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/damage_vulnerability.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/language.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/save_ranking.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/components/skill.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/modals.html",		  
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_abilities.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_armor_class.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_attack_bonus.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_attack_dcs.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_combat.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_condition_immunities.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_cr.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_damage_immunities.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_damage_resistances.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_damage_vulnerabilities.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_damage.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_description.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_hit_points.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_languages.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_perception.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_proficiency.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_saving_throws.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_senses.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_skills.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_speeds.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options_xp.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/options.html",
		  "modules/giffyglyphs-5e-monster-maker/templates/partials/monster/core/view.html"
		]);
	};

	function registerHandlebarsHelpers() {

		Handlebars.registerHelper('concat', function(...args) {
			return args.slice(0, -1).join('');
		});

		Handlebars.registerHelper('eq', function(a, b) {
			return a === b;
		});

		Handlebars.registerHelper('strlen', function(str) {
			return String(str).length;
		});

		Handlebars.registerHelper('toggleCustom', function(showCustom, options) {
			let html = options.fn(this);
			if (showCustom !== "custom") {
				html = html.replace(/input /g, "input type='hidden'");
			}
			return html;
		});

		Handlebars.registerHelper('repeat', function(n, block) {
			var accum = '';
			for(var i = 0; i < n; ++i)
				accum += block.fn(i);
			return accum;
		});

		Handlebars.registerHelper('for', function(from, to, incr, block) {
			var accum = '';
			for(var i = from; i < to; i += incr)
				accum += block.fn(i);
			return accum;
		});

		Handlebars.registerHelper('parseSources', function(sources) {
			return sources.map((x) => {
				return `${isNaN(x.value) ? x.value : ((x.value >= 0) ? `+${x.value}` : `−${Math.abs(x.value)}`)} from ${x.source}`
			}).join(",&#010;");
		});
	}

	function _openModal(event) {
		const button = event.currentTarget.closest("button");
		const modal = $(button).closest(".gg5e-mm-window").find(`#${button.dataset.modal}`)
		if (modal) {
			modal.addClass("open");
		}
	}

	function closeModal(event) {
		const modal = event.currentTarget.closest(".modal");
		modal.classList.remove("open");
	}

    function _togglePanelCollapse(event) {
		const panel = event.currentTarget.closest(".gg5e-mm-panel");
		const panelId = panel.id.replace(/-/g, '_');
		const newState = panel.classList.contains("closed") ? "opened" : "closed";
		$(panel).closest(".gg5e-mm-window").find(`input[name='data.gg5e_mm.gui.data.panels.${panelId}']`).val(newState).trigger("change");
	}

	function _toggleAccordionCollapse(event) {
		const accordion = event.currentTarget.closest(".gg5e-mm-accordion");
		const accordionId = accordion.id.replace(/-/g, '_');
		const section = event.currentTarget.closest(".accordion-section");
		let index = "";
		if (accordion.getAttribute("data-accordion-mode") == "single") {
			index = section.classList.contains("opened") ? "" : section.getAttribute("data-section");
		} else {
			section.classList.toggle("opened");
			index = [...accordion.querySelectorAll(".accordion-section.opened")].map((x) => x.getAttribute("data-section")).join(",");
		}
		$(accordion).closest(".gg5e-mm-window").find(`input[name='data.gg5e_mm.gui.data.accordions.${accordionId}']`).val(index).trigger("change");
	}

	function _moveUp(event) {
		const li = event.currentTarget.closest('.move-parent');
		if (li.previousElementSibling) {
    		li.parentNode.insertBefore(li, li.previousElementSibling);
		}
	}

	function _moveDown(event) {
		const li = event.currentTarget.closest('.move-parent');
		if (li.nextElementSibling) {
    		li.parentNode.insertBefore(li.nextElementSibling, li);
		}
	}

	return {
		activateListeners: activateListeners,
		setAccordions: setAccordions,
		setPanels: setPanels,
		setScrollbars: setScrollbars,
		prepareGui: prepareGui,
		preloadHandlebarsTemplates: preloadHandlebarsTemplates,
		registerHandlebarsHelpers: registerHandlebarsHelpers,
		closeModal: closeModal
	};
})();

export default Gui;