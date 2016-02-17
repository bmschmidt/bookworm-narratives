
/**
 * scrollVis - encapsulates
 * all the code for the visualization
 * using reusable charts pattern:
 * http://bost.ocks.org/mike/chart/
 */

var scrollVis = function() {
    // constants to define the size
    // and margins of the vis area.
    width = 600;
    height = 520;
    margin = {top:0, left:20, bottom:40, right:20};

    // Keep track of which visualization
    // we are on and which was the last
    // index activated. When user scrolls
    // quickly, we want to call all the
    // activate functions that they pass.
    var lastIndex = -1;
    var activeIndex = 0;

    // main svg used for visualization
    var svg = null;

    // d3 selection that will be used
    // for displaying visualizations
    var g = null;


    baseTimeScale = d3.scale.linear().domain([1850,1900]).range([0,width])


    startPointsScale = function(intercept) {
	dom = baseTimeScale.domain()
	range = baseTimeScale.range()
	var intercept = intercept || dom[0]
	stepSize = (baseTimeScale(1865) - baseTimeScale(1864))/Math.sqrt(2)
	lastScaleYear =  dom[1] + 10
	return d3.scale.linear().domain([
	    intercept,
	    lastScaleYear])
	    .range([0,(lastScaleYear-intercept)*stepSize])
    }

    endPointsScale = function(intercept) {
	dom = baseTimeScale.domain()
	range = baseTimeScale.range()
	var intercept = intercept || dom[1]
	stepSize = (baseTimeScale(1865) - baseTimeScale(1864))/Math.sqrt(2)
	firstScaleYear =  dom[0] - 10
	return d3.scale.linear().domain([
	    intercept,
	    firstScaleYear
	])
	    .range([(intercept-firstScaleYear)*stepSize,0])
    }

    
    durationScale = d3.scale.linear().domain([0,baseTimeScale.domain()[1]-baseTimeScale.domain()[0]]).range([baseTimeScale.range()[1]/2,0])
    rotatedStartScale = d3.scale.linear().domain([1850,1900])
    rotatedEndScale = d3.scale.linear().domain([1850,1900])
    baseTimeAxis  = d3.svg.axis().scale(baseTimeScale).tickFormat(d3.format("04d"))

    
    rotatedStartAxis  = function(intercept) {
	intercept = intercept || baseTimeScale.domain()[0]
	return function(selection) {
	    selection
		.call(
		    d3.svg.axis().scale(startPointsScale(intercept))
			.tickFormat(d3.format("04d"))
			.orient("top")
		)
		.attr("transform","translate("  + baseTimeScale(intercept) + "," + (height/2 )+ " ) rotate(-45," + 0 +" ," + 0 + ")")
	}
    }

    rotatedEndAxis  = function(intercept) {
	intercept = intercept || baseTimeScale.domain()[1]
	return function(selection) {
	    var endScale = endPointsScale(intercept)
	    var axisBoxSize = (endScale.range()[0] - endScale.range()[1])/Math.sqrt(2)
	    selection
		.call(
		    d3.svg.axis().scale(endScale)
			.tickFormat(d3.format("04d"))
			.orient("top")
		)
	    	.attr("transform","translate("  + (baseTimeScale(intercept)-axisBoxSize) + "," + (height/2 - axisBoxSize ) + " ) rotate(45," + 0 +" ," + 0 + ")")

	}
    }
    

    // When scrolling to a new section
    // the activation function for that
    // section is called.
    var activateFunctions = [];
    // If a section has an update function
    // then it is called while scrolling
    // through the section with the current
    // progress through the section.
    var updateFunctions = [];

    /**
     * chart
     *
     * @param selection - the current d3 selection(s)
     *  to draw the visualization in. For this
     *  example, we will be drawing it in #vis
     */
    var chart = function(selection) {
        selection.each(function(rawData) {
            // create svg and give it a width and height
            svg = d3.select(this).selectAll("svg").data([1]);
            svg.enter().append("svg").append("g").attr("id","container");

            svg.attr("width", width + margin.left + margin.right);
            svg.attr("height", height + margin.top + margin.bottom);


            // this group element will be used to contain all
            // other elements.
            g = svg.select("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

            // perform some preprocessing on raw data
            setupVis();

            setupSections();

        });
    };


    /**
     * setupVis - creates initial elements for all
     * sections of the visualization.
     *
     * @param wordData - data object for each word.
     * @param fillerCounts - nested data that includes
     *  element for each filler word type.
     * @param histData - binned histogram data
     */
    setupVis = function() {

        axisLocation = height/2
        lineOffset = 2.5

        // The base time axis
        g.append("g")
            .attr("class", "x axis basic")
            .attr("transform", "translate(0," + axisLocation + ")")
            .call(baseTimeAxis)
	    .append("text")
	    .text("")
	    .attr("class","axistitle")
	    .attr("transform","translate(20,-25)")
	
	g.append("g")
            .attr("class", "x axis diag1")
            .attr("transform", "translate(0," + axisLocation + ")")
            .call(baseTimeAxis)
	    .attr("display","none")
	    .append("text")
	    .text("end date")
	    .attr("class","axistitle")
	    .attr("transform","translate(20,-25)")

	
	g.append("g")
            .attr("class", "x axis diag2")
            .attr("transform", "translate(0," + axisLocation + ")")
            .call(baseTimeAxis)
	    .attr("display","none")
	    .append("text")
	    .text("start date")
	    .attr("class","axistitle")
	    .attr("transform","translate(20,-25)")
	
        g.select(".x.axis").style("opacity", 0);

        // count openvis title
        g.append("text")
            .attr("class", "title openvis-title")
            .attr("x", width / 2)
            .attr("y", height / 3)
            .text("Exploring the shape");

        g.append("text")
            .attr("class", "sub-title openvis-title")
            .attr("x", width / 2)
            .attr("y", (height / 3) + (height / 5) )
            .text("of the historiography");

        g.selectAll(".openvis-title")
            .attr("opacity", 0);


        initialDissertationPositions = function(dissertations) {
            dissertations
                .attr("transform",function(d) {
                    var x = baseTimeScale(d.start)
                    var y = axisLocation
                    return "translate(" + x + "," + y + ")"
                })
            return dissertations
        }

        rotatedDissertationPositions = function(dissertations) {
            dissertations
                .attr("transform",function(d) {
                    var x = baseTimeScale(d.start)
                    var y = axisLocation
                    return "translate(" + x + "," + y + ") rotate(90," +
                        ((baseTimeScale(d.end) - baseTimeScale(parseInt(d.start)))/2) +
                        ",0)"
                })
            return dissertations
        }

        verticalDissertationPositions = function(dissertations) {
            dissertations
                .attr("transform",function(d) {
                    var x = baseTimeScale((parseInt(d.start) + parseInt(d.end))/2)
                    var y = axisLocation
                    return "translate(" + x + "," + y + ") rotate(-90," +
                        ((baseTimeScale(d.end) - baseTimeScale(parseInt(d.start)))/2) +
                        ",0)"
                })
            return dissertations
        }

	showTextForGrouping = function(d) {
		    d3
			.select(this)
			.selectAll("circle")
			.classed("highlit",true)

		    d3
			.select(this)
			.append("text")
			.attr("class","demo")
			.text(d.title)
	}
	
	hideTextForGrouping = function(d) {
	    d3
		.select(this)
		.selectAll("circle")
		.classed("highlit",false)
	    d3
		.select(this)
		.selectAll("text.demo").remove()
	}
	
	enterPointsForData = function(data) {
	    var dissertations = g.selectAll("g.dissertation")
		.data(data,function(d) {return d.title})
	    
	    dissertations
		.enter()
		.append("g")
		.classed("dissertation",true)
		.call(initialDissertationPositions)
		.on("mouseover",showTextForGrouping)
		.on("mouseout",hideTextForGrouping)

	    
	    return dissertations
	}

	enterStartCircles = function(dissertations) {
	    var starts = dissertations
		.append("circle")
		.attr("class","dissertation start hidden")
	    
	    return starts
	}
	
	enterEndCircles = function(dissertations) {
            var ends = dissertations.append("circle").attr("class","dissertation end")
		.classed("hidden",true)
		.call(initialEnds)
	    return ends
	}

	enterDurations = function(dissertations) {
            var durations = dissertations.append("line").attr("class","dissertation")
		.classed("hidden",true)
		.call(initialLine)
	    return durations
	}

	
        jitterordering = function(scale) {
            // Turns out easiest if this returns a different function for each scale.
            // I think from Haskell that this is called "currying". Or is it called uncurrying?
            return function(dissertations) {

                dissertations
                    .attr("transform",function(d) {
                        return "translate(" + baseTimeScale(d.start) + "," +
                            scale(d.title)
                            + ")"
                    })

                return dissertations
            }
        }

        var lineOffset = 2.5

        initialStarts = function(selection) {
            selection
		.attr("cx",0)
		.attr("cy",0)
            return selection
        }

        initialEnds = function(selection) {
            selection
                .attr("cy",0)
                .attr("cx",function(d) {
                    return (baseTimeScale(d.end) - baseTimeScale(d.start))
                })
            return selection
        }
	initialMids = function(selection) {
            selection
                .attr("cy",0)
                .attr("cx",function(d) {
                    return ((baseTimeScale(d.mid) - baseTimeScale(d.start)))
                })
            return selection
        }


        horizontalEnds = function(selection) {
            selection
                .attr("cx",0)
                .attr("cy",function(d) {
                    return -(baseTimeScale(d.end) - baseTimeScale(d.start))
                })
            return selection
        }


        startBoundLine = function(selection) {
            selection
                .attr("x1",0)
                .attr("y1",0)
                .attr("y2",0)
                .attr("x2",0)
            return selection
        }

        initialLine = function(selection) {
            selection
                .attr("x1",lineOffset)
                .attr("y1",0)
                .attr("y2",0)
                .attr("x2",function(d) {return -lineOffset+(baseTimeScale(d.end) - baseTimeScale(d.start))})
            return selection
        }


        horizontalDurations = function(selection) {
            selection
                .attr("y1",-lineOffset)
                .attr("x1",0)
                .attr("x2",0)
                .attr("y2",function(d) {return -(baseTimeScale(d.end) - baseTimeScale(d.start)) -lineOffset})
            return selection
        }

	fullDissertations = enterPointsForData(fullData)
	
	fullStarts = enterStartCircles(fullDissertations)
	fullEnds = enterEndCircles(fullDissertations)
	fullDurations = enterDurations(fullDissertations)

	dissertations = fullDissertations.filter(function(d) {
	    return d.title.match("econstruction")
	})
	
	starts = dissertations.selectAll("circle.start")
	ends = dissertations.selectAll("circle.end")
	durations = dissertations.selectAll("line")
	

	
        //Build three scales for ordering by start, end, and middle
        reconstructionDisses.sort(function(a,b) {
            return (a.start-b.start) + .0001*(a.end-b.end)
        })

        startScale = d3
            .scale.ordinal()
            .domain(reconstructionDisses.map(function(d) {return d.title}))
            .rangePoints([5,axisLocation])


        reconstructionDisses.sort(function(a,b) {
            return (a.end-b.end) + .0001*(a.start-b.start)
        })

        endScale = d3
            .scale.ordinal()
            .domain(reconstructionDisses.map(function(d) {return d.title}))
            .rangePoints([5,axisLocation])


        reconstructionDisses.sort(function(a,b) {
            return (a.mid-b.mid)
        })

        midScale = d3
            .scale.ordinal()
            .domain(reconstructionDisses.map(function(d) {return d.title}))
            .rangePoints([5,axisLocation])




	




    }

    /**
     * setupSections - each section is activated
     * by a separate function. Here we associate
     * these functions to the sections based on
     * the section's index.
     *
     */
    setupSections = function() {
        // activateFunctions are called each
        // time the active section changes
        // I change from Vallandinghams to allow writing the code inside the loop.
        activateFunctions = steps.map(function(d) {return d.function})
        d3.select("#sections").selectAll("section").remove()
        var sections = d3.select("#sections").selectAll("section").data(steps)
        sections.exit().remove()
        var newsections = sections
            .enter().append("section").attr("class","step")
        newsections.append("div").attr("class","title").text(function(d) {return d.title})
        newsections.append("text").text(function(d) {return d.text})

        // updateFunctions are called while
        // in a particular section to update
        // the scroll progress in that section.
        // Most sections do not need to be updated
        // for all scrolling and so are set to
        // no-op functions.
        for(var i = 0; i < activateFunctions.length; i++) {
            updateFunctions[i] = function() {};
        }
        //    updateFunctions[7] = updateCough;
    };

    steps = [
        {"function": function() {
            d3.selectAll(".x.axis.basic").transition().duration(30).style("opacity",1)
        },
         "title":"Timeline",
         "text":"This is an ordinary, one-dimensional timeline. We like to think of time as one dimensional; but in fact all that simultaneity is so strong that it's hardly possible represent it visually as a line."
        },
        { "function":function() {
            // for scrollback
	    ends.transition().duration(100).style("opacity",0)

	    // new elements
            starts.classed("hidden",false).style("opacity",0)
		.transition().duration(1000).delay(function(d) {
                    return 3*baseTimeScale(d.start)
		})
		.style("opacity",1)
        },
          "title":"Dissertation Start Years",
          "text":"Here, arrayed on it, are all of the start years of dissertations that have the word 'reconstruction' in the title."
        },
        {"function":function() {
	    starts.transition().duration(100).style("opacity",0)
	    
            ends
		.classed("hidden",false)
		.transition().duration(1000).delay(function(d) {
		return 3*baseTimeScale(d.end)
        })
            .style("opacity",1)
	},
         "title":"End Dates",
         "text":"Here are the end dates"
        },
        {"function":function() {
	    durations.classed("hidden",false).transition().duration(300).style("opacity",0)
            ends.transition().duration(1000).style("opacity",0)
            starts.transition().duration(1000).style("opacity",1)
        var duration = 3000
        dissertations.transition().duration(duration).delay(1500).call(jitterordering(startScale))

	},
         "title":"Arrange by start date",
         "text":"One option is to just arrange by the start date. We can order those nicely using an ordinal scale; it makes clear how important 1865 is as a start date."
        },
        {"function":jitterStep2,
         "title":"Full time spans",
         "text":"But once we add the end dates, the ordering of the time spans is less obvious."
        },
        {"function":jitterStep3,
         "title":"Sorting by end date",
         "text":"Another option is to sort by end date. This doesn't add all that much."
        },

        {"function":function() {
	    duration = 3000
            ends.transition().duration(duration).style("opacity",1).call(initialMids)

	    dissertations.transition().duration(duration)
		.call(jitterordering(midScale))

            durations.transition().duration(duration).call(initialLine)

	},
         "title":"Sorting by middle date",
         "text":"Sorting by midpoints isn't much better: but it opens interesting possibilities.",
        },
        {"function":vertical1,
         "title":"Rotating around midpoints makes the y axis time as well",
         "text":"By just rotating the time spans in place, we get a timechart (no longer just a timeline) with more interesting properties."
        },
        {"function":function() {
	    
	    d3.select(".axis.diag1").transition().duration(1000).style("opacity",0)
		.attr("display","none")
	    
            d3.selectAll("g.dissertation").transition().duration(2000).style("opacity",function(d) {return d.start==1865? 1 : .05})
		.call(rotatedDissertationPositions)
        },
         "title":"Start dates form uninterrupted lines",
         "text":"Here are the dissertations that start in 1865: they now form a diagonal line."
        },
        {"function":function() {
	    
	    d3.select(".axis.diag1")
		.attr("display","")
		.transition().duration(3000)
		.style("opacity",1)
		.call(rotatedStartAxis(1865))
	    

            d3.selectAll("g.dissertation").transition().duration(2000).style("opacity",function(d) {return d.start==1865? 1 : .05})
		.call(rotatedDissertationPositions)
        },
         "title":"These lines express an implicit axis",
         "text":"In fact, you can think of these diagonal lines as another axis rotated 45 degrees relative to the main axis. Every dissertation lying on this line starts in 1865; the end points are marked on the axis."
        },
        {"function":function() {
            d3.selectAll("g.dissertation").transition().duration(2000).style("opacity",function(d) {return d.end==1877? 1 : .05})
	    	.call(rotatedDissertationPositions)
	    
	    d3.selectAll(".axis.diag1").style("opacity",.08)

	    d3.selectAll(".axis.diag2").style("opacity",0)
        },
         "title":"End dates form uninterrupted lines",
         "text":"Likewise, dissertations that end in 1877 lie along a perpendicular line. The one point shared by both of these consists of all dissertations that start in 1865 and end in 1877."
        },
	{"function":function() {
	    
	    d3.select(".axis.diag2")
		.attr("display","")
		.transition()
		.duration(3000)
		.style("opacity",1)
		.call(rotatedEndAxis(1877))
	    

            d3.selectAll("g.dissertation")
		.transition().duration(2000).style("opacity",function(d) {return d.end==1877? 1 : .05})
		.call(rotatedDissertationPositions)
        },
         "title":"Again, there is an implicit axis",
         "text":"The implicit axis here is rotated in the opposite direction. Every dissertation lying on this line starts in 1865; the end points are marked on the axis."
        },
        {"function":function() {

	    baseTimeScale.domain([1850,1900])

	    d3.select(".x.axis.basic").transition().duration(3000).call(baseTimeAxis).style("opacity",1)

	    fullDissertations
		.filter(function(d) {
		    return !d.title.match("econstruction")
		})
		.classed("hidden",true)

	    starts.transition().duration(duration).call(initialStarts).style("opacity",1)
	    ends.transition().duration(duration).call(initialMids)
	    durations.transition().duration(duration).call(initialLine)
	    
	    dissertations
		.transition()
		.duration(duration)
		.style("opacity",function(d) {return d.end-d.start==12? 1 : .05})
	    	.call(rotatedDissertationPositions)
        },
         "title":"Common lengths form continuous lines",
         "text":"And finally, common lengths form continuous lines. Here are all the dissertations that cover a period of ten years with 'Reconstruction' in the title. 1865-1877 is the most common length; but there are also dissertations for the 12-year periods 1854-66,1855-67,1856-68, and 1857-69."
        }
	,
	{"function":function() {

	    duration = 3000;
	    
	    baseTimeScale.domain([1750,2000])

	    
	    fullDurations.call(initialLine)
	    fullEnds.call(initialMids)

	    fullDissertations
	    	.classed("hidden",false)
		.transition()
		.duration(duration)
	    	.call(rotatedDissertationPositions)
		.style("opacity",1)

	    fullDissertations
	    	.selectAll("line")
		.classed("hidden",false)
		.style("opacity",.33)
	    
	    d3.select(".x.axis.basic").transition().duration(duration)
		.call(baseTimeAxis)
		.style("opacity",1)
	    
        },
	 
         "title":"Larger Data Sets",
         "text":"The benefits of this are particularly important with larger data sets. We've been looking at just a couple dozen dissertations with 'reconstruction' in the title; now we'll expand out to look at every dissertation that mentions 'United States' or 'America' as well. There are about 5,000 of these."
        },

	{"function":function() {
	    d3.select("#container").transition().duration(5000).attr("transform","scale(.707) rotate(-90," + (width/2) + "," + (height/2) + ")")
	},"title":"One last rotation",
	 "text":"Finally, one last rotation makes historical time run from top to bottom instead of left to right. This makes it possible to read the labels again."


	}
    ]


    function jitterStep2() {
        var duration = 3000
        ends.transition().duration(0).call(initialStarts).each("end",function() {
            d3.select(this).transition().duration(duration).style("opacity",1).call(initialEnds)
        })
            durations.call(startBoundLine).style("opacity",1)
        durations.transition().duration(duration).call(initialLine)
    }

    function jitterStep3() {
        duration = 3000
        dissertations.transition().duration(duration).call(jitterordering(endScale))
	ends.transition().duration(duration).style("opacity",1).call(initialEnds)
    }
    function shiftToMids() {
    }
    function jitterStep4() {
	duration = 3000
//        dissertations.transition().duration(duration)
    }

    function vertical1() {
        duration = 3000
        d3.selectAll("g.dissertation").style("opacity","")
        dissertations
            .transition()
            .delay(function(d) {
                return 15*midScale(d.title)
            })
            .duration(duration)
	    .style("opacity",1)
//            .ease("linear")
            .call(rotatedDissertationPositions)

        //      ends.transition().duration(duration).call(initialEnds)
        //      starts.transition().duration(duration).call(initialStarts)
        // durations.transition("spinner3").duration(0).call(initialLine)



    }

    
    function showTitle() {
        g.selectAll(".count-title")
            .transition()
            .duration(0)
            .attr("opacity", 0);

        g.selectAll(".openvis-title")
            .transition()
            .duration(600)
            .attr("opacity", 1.0);
    }

    /**
     * showGrid - square grid
     *
     * hides: filler count title
     * hides: filler highlight in grid
     * shows: square grid
     *
     */
    function showGrid() {
        g.selectAll(".count-title")
            .transition()
            .duration(0)
            .attr("opacity", 0);

        g.selectAll(".square")
            .transition()
            .duration(600)
            .delay(function(d,i) {
                return 5 * d.row;
            })
            .attr("opacity", 1.0)
            .attr("fill", "#ddd");
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
function display(data) {
    // create a new plot and
    // display it
    var plot = scrollVis();

//    data = data.filter(function(d) {
//        return (d.start > 1849 && d.end < 1900)
//    })

    data.forEach(function(d) {
        d.start  = parseInt(d.start)
        d.end    = parseInt(d.end)
        d.mid    = d3.mean([d.start,d.end])
        d.length = d.end-d.start
    })

    fullData = data

    reconstructionDisses = data.filter(function(d) {return d.title.match("Reconstruction")})
    //    data = data.sort(function(a,b) {
    //        return (a.start - b.start)
    //    })

    d3.select("#vis")
        .datum(data)
        .call(plot);

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

// load data and display
d3.tsv("data/demo.tsv", display);
