"use strict";

/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */



var scrollVis = function(story_elements) {
    // constants to define the size
    // and margins of the vis area.
    var width = 600;
    var height = 520;
    var margin = {top:0, left:20, bottom:40, right:20};

    // Keep track of which visualization
    // we are on and which was the last
    // index activated. When user scrolls
    // quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;
    var chart = {}

    // main svg used for visualization
    var svg = null;

    // d3 selection that will be used
    // for displaying visualizations
    var g = null;

    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     *
     */
    var setupVis = function() {

        var svg = d3.select("#SVG-main")
        var g = svg.select("#root")
    }

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */

    var updateFunctions = [];
    var activateFunctions = [];
    chart.setupSections = function() {
        // activateFunctions are called each
        // time the active section changes
        // I change from Vallandinghams to allow writing the code inside the loop.

     var bookworm = Bookworm()
	   bookworm.silent = true
  	 bookworm.makePlotArea(d3.select("#vis").select("svg"))
        activateFunctions = story_elements.map( function(d) {
                if (d.function) {return d.function}
                else if (d.call=="bookworm") {
                    return function() {
                        bookworm.query = d.API_call;
                        bookworm.updatePlot()
                    }
                }

                else {
                    return function () {
                        console.log("no function bound to this element.")
                    }
                }
            })

	d3.select("#sections").selectAll("section").remove()
        var sections = d3.select("#sections").selectAll("section").data(story_elements)
        sections.exit().remove()
        var newsections = sections
            .enter()
            .append("section")
            .attr("class","step")

        newsections.append("div").attr("class","title").text(function(d) {return d.title})
        newsections.append("div").html(function(d) {return d.text})

	story_elements.forEach(function(d) {console.log(d.title)})
        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for(var i = 0; i < activateFunctions.length; i++) {
            updateFunctions[i] = function() {};
        }

    }
    chart.activate = function(index) {
        activeIndex = index;
        var sign = (activeIndex - lastIndex) < 0 ? -1 : 1;
        var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);
        scrolledSections.forEach(function(i) {
            activateFunctions[i]();
        });
        lastIndex = activeIndex;
    };

    /**
     * update
     *
     * @param index
     * @param progress
     */
    chart.update = function(index, progress) {
        updateFunctions[index](progress);
    }

    // return chart function
    return chart;
};
/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param data - loaded tsv data
 */
function display(story_elements) {
    // create a new plot and
    // display it

    story_elements.forEach(function(d) {console.log(d)})
    var plot = scrollVis(story_elements);

    plot.setupSections()
    plot.activate()

    console.log(plot)
    // setup scroll functionality
    var scroll = scroller()
        .container(d3.select('#graphic'));

    // pass in .step selection as the steps
    scroll(d3.selectAll('.step'));

    // setup event handling
    scroll.on('active', function(index) {
        // highlight current step text
        d3.selectAll('.step')
            .style('opacity',  function(d,i) { return i == index ? 1 : 0.1; });
        // activate current section
        plot.activate(index);
    });

    scroll.on('progress', function(index, progress){
        plot.update(index, progress);
    });
}
console.log("yo")
d3.json("story.json", display);
