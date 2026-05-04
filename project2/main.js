// 存储 ECharts 实例，方便全局调用
let myCharts = [];

document.addEventListener('DOMContentLoaded', function() {
    // 初始化拖拽交换功能
    initDragAndDrop();

    // 读取本地 CSV 文件
    fetch('WorldCupsSummary.csv')
        .then(response => response.text())
        .then(csvText => processDataAndRender(csvText))
        .catch(error => console.error('数据加载失败:', error));
});

function processDataAndRender(csvData) {
    // --- 1. 数据解析 ---
    const lines = csvData.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    const columnIndex = {
        year: headers.indexOf('Year'),
        winner: headers.indexOf('Winner'),
        goals: headers.indexOf('GoalsScored'),
        teams: headers.indexOf('QualifiedTeams'),
        attendance: headers.indexOf('Attendance')
    };

    const data = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map(function(line) {
            const parts = line.split(',');
            return {
                year: parts[columnIndex.year],
                winner: parts[columnIndex.winner],
                goals: parseInt(parts[columnIndex.goals]),
                teams: parseInt(parts[columnIndex.teams]),
                attendance: parseInt(parts[columnIndex.attendance])
            };
        });

    // --- 2. 数据聚合 ---
    const yearList = data.map(item => item.year);
    const goalsList = data.map(item => item.goals);
    const attendanceList = data.map(item => item.attendance);

    const winCount = {};
    data.forEach(item => winCount[item.winner] = (winCount[item.winner] || 0) + 1);

    const pieData = Object.keys(winCount).map(country => ({
        name: country,
        value: winCount[country]
    }));

    // --- 3. 图表渲染 ---
    const chart1 = echarts.init(document.getElementById('chart1'));
    const chart2 = echarts.init(document.getElementById('chart2'));
    const chart3 = echarts.init(document.getElementById('chart3'));
    const chart4 = echarts.init(document.getElementById('chart4'));
    
    myCharts = [chart1, chart2, chart3, chart4];

    // [图表 1] 柱状图
    chart1.setOption({
        title: { text: '历届世界杯总进球数趋势', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: yearList, axisLabel: { rotate: 45 } },
        yAxis: { type: 'value', name: '进球数' },
        series: [{ type: 'bar', data: goalsList, itemStyle: { color: '#5470C6' } }]
    });

    // [图表 2] 饼图
    chart2.setOption({
        title: { text: '各国家夺冠频次分布', left: 'center' },
        tooltip: { trigger: 'item' },
        legend: { type: 'scroll', orient: 'horizontal', bottom: 0, left: 'center', textStyle: { fontSize: 12 } },
        series: [{
            type: 'pie',
            radius: '55%', center: ['50%', '45%'], data: pieData,
            emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
    });

    // [图表 3] 折线图
    chart3.setOption({
        title: { text: '历届观众人数演变', left: 'center' },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: yearList, axisLabel: { rotate: 45 } },
        yAxis: { type: 'value', name: '总观众人数' },
        series: [{ type: 'line', data: attendanceList, smooth: true, itemStyle: { color: '#91CC75' } }]
    });

    // [图表 4] 散点图
    chart4.setOption({
        title: { text: '参赛规模与进球数相关性', left: 'center' },
        tooltip: { 
            trigger: 'item',
            formatter: function (params) {
                return '参赛队伍: ' + params.data[0] + '<br/>进球数: ' + params.data[1];
            }
        },
        dataZoom: [
            { type: 'inside', xAxisIndex: 0, zoomOnMouseWheel: 'ctrl', moveOnMouseMove: true },
            { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: 'ctrl', moveOnMouseMove: true }
        ],
        xAxis: { type: 'value', name: '参赛队伍数' },
        yAxis: { type: 'value', name: '进球数' },
        series: [{
            type: 'scatter',
            data: data.map(item => [item.teams, item.goals]),
            itemStyle: { color: '#FAC858' }, symbolSize: 8
        }]
    });

    window.addEventListener('resize', () => myCharts.forEach(c => c.resize()));
}

// --- 拖拽功能逻辑 ---
function initDragAndDrop() {
    const gridItems = document.querySelectorAll('.grid-item');
    let draggedItem = null;

    gridItems.forEach(item => {
        const handle = item.querySelector('.drag-handle');
        
        handle.addEventListener('mousedown', () => item.setAttribute('draggable', 'true'));
        handle.addEventListener('mouseup', () => item.setAttribute('draggable', 'false'));
        item.addEventListener('mouseleave', () => item.setAttribute('draggable', 'false'));

        item.addEventListener('dragstart', function(e) {
            draggedItem = this;
            e.dataTransfer.effectAllowed = 'move';
            setTimeout(() => this.classList.add('dragging'), 0);
        });

        item.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            gridItems.forEach(c => c.classList.remove('drag-over'));
            draggedItem = null;
        });

        item.addEventListener('dragover', function(e) {
            e.preventDefault();
            if (this !== draggedItem) this.classList.add('drag-over');
        });

        item.addEventListener('dragleave', function() {
            this.classList.remove('drag-over');
        });

        item.addEventListener('drop', function(e) {
            e.preventDefault();
            this.classList.remove('drag-over');

            if (this !== draggedItem) {
                const parent = this.parentNode;
                const siblingA = draggedItem.nextSibling === this ? draggedItem : draggedItem.nextSibling;
                
                this.parentNode.insertBefore(draggedItem, this);
                parent.insertBefore(this, siblingA);

                setTimeout(() => myCharts.forEach(chart => chart.resize()), 50);
            }
        });
    });
}