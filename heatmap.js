const width = 800;
const height = 500;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const svg = d3.select("#map-container")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .style("background-color", "#f0f0f0");
    
const projection = d3.geoEquirectangular()
    .center([0, 0])
    .scale(width / (2 * Math.PI))
    .translate([width / 2, height / 2]);
    
const colorScale = d3.scaleSequential(d3.interpolateInferno)
    .domain([230, 310]);

// 使用 fetch 和 JSZip 来加载和解压 zip 文件
fetch("dataset/temperature_data.zip")
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.arrayBuffer();
    })
    .then(buffer => {
        // 使用 JSZip 解压
        return JSZip.loadAsync(buffer);
    })
    .then(zip => {
        // 获取 zip 文件中的 temperature_data.json
        const jsonFile = zip.file("temperature_data.json");
        if (!jsonFile) {
            throw new Error("temperature_data.json not found in zip file");
        }
        return jsonFile.async("string");
    })
    .then(jsonString => {
        // 解析 JSON
        const allData = JSON.parse(jsonString);
        
        const timePoints = Object.keys(allData).sort(); 
        const slider = document.getElementById('time-slider');
        slider.max = timePoints.length - 1; 
        
        let currentTimeIndex = 0;
        
        function renderHeatmap(timeIndex) {
            const currentTime = timePoints[timeIndex];
            document.getElementById('current-time-display').textContent = currentTime;
            
            const currentData = allData[currentTime];
            const circles = svg.selectAll(".data-point")
                .data(currentData, d => d[0] + "," + d[1]); 
                
            circles.exit().remove();
            circles.enter()
                .append("circle")
                .attr("class", "data-point")
                .attr("r", 3) 
                .merge(circles) 
                .attr("cx", d => projection([d[0], d[1]])[0]) 
                .attr("cy", d => projection([d[0], d[1]])[1])
                .attr("fill", d => colorScale(d[2]))
                .attr("stroke", "none");
        }
        
        slider.oninput = function() {
            currentTimeIndex = +this.value;
            renderHeatmap(currentTimeIndex);
        };
        
        renderHeatmap(currentTimeIndex);
        
        svg.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", width)
            .attr("height", height)
            .attr("fill", "none")
            .attr("stroke", "#333")
            .attr("stroke-width", 1);
            
        console.log("D3 Heatmap loaded successfully.");
    })
    .catch(error => {
        console.error("Error occurred while loading the data file:", error);
    });