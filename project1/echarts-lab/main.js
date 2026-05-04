import * as echarts from 'echarts';
import Papa from 'papaparse';

const barChart = echarts.init(document.getElementById('chart-bar'));
const pieChart = echarts.init(document.getElementById('chart-pie'));

// --- 全局状态管理 ---
let globalData = [];
let flagMap = {}; // 存储 国家名字 -> 国旗URL 的映射字典
let safeIdMap = {}; // 【新增】存储 国家名字 -> 英文安全ID，解决 ECharts 富文本不支持中文 Key 的问题
let isDescending = true; 
let activeLegends = { '金牌': true, '银牌': true, '铜牌': true };

// 1. 获取并解析数据
async function loadAndRenderData() {
  try {
    const response = await fetch('/medals_countries.csv');
    const csvText = await response.text();

    Papa.parse(csvText, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: function (results) {
        globalData = results.data;
        
        // 构建国旗字典和安全ID字典
        globalData.forEach((item, index) => {
          if (item.国家 && item.国旗) {
            flagMap[item.国家] = item.国旗;
            // 【关键修复】生成英文字母组成的合法 Key
            safeIdMap[item.国家] = 'flag_' + index; 
          }
        });
        
        updateCharts(); // 初次渲染
      }
    });
  } catch (error) {
    console.error("加载数据失败:", error);
  }
}

// 2. 根据状态计算、排序并渲染图表
function updateCharts() {
  const processedData = globalData.map(item => {
    let currentTotal = 0;
    if (activeLegends['金牌']) currentTotal += (item.金牌 || 0);
    if (activeLegends['银牌']) currentTotal += (item.银牌 || 0);
    if (activeLegends['铜牌']) currentTotal += (item.铜牌 || 0);
    return { ...item, currentTotal };
  });

  processedData.sort((a, b) => {
    return isDescending ? b.currentTotal - a.currentTotal : a.currentTotal - b.currentTotal;
  });

  const countries = processedData.map(item => item.国家);
  const golds = processedData.map(item => item.金牌);
  const silvers = processedData.map(item => item.银牌);
  const bronzes = processedData.map(item => item.铜牌);
  const pieData = processedData.map(item => ({ name: item.国家, value: item.总数 }));

  // === 构建富文本配置 (Rich Text) 用于显示国旗 ===
  
  // 1. 柱状图 X 轴的国旗配置
  const xAxisRich = {
    value: { lineHeight: 20, align: 'center', color: '#666' }
  };
  countries.forEach(c => {
    const safeKey = safeIdMap[c]; // 获取安全的英文字符串
    if (safeKey) {
      xAxisRich[safeKey] = {
        height: 20,
        width: 30,
        align: 'center',
        backgroundColor: { image: flagMap[c] } // 动态加载国旗
      };
    }
  });

  // 2. 饼图中心的国旗与文字配置
  const pieRich = {
    nameStyle: { fontSize: 22, fontWeight: 'bold', color: '#333', padding: [5, 0] },
    valStyle: { fontSize: 16, color: '#888' }
  };
  Object.keys(flagMap).forEach(c => {
    const safeKey = safeIdMap[c]; // 获取安全的英文字符串
    if (safeKey) {
      pieRich[safeKey] = {
        height: 40,
        width: 60,
        align: 'center',
        backgroundColor: { image: flagMap[c] }
      };
    }
  });

  // 3. 饼图图例配置
  const legendDataWithFlags = pieData.map(item => ({
    name: item.name,
    icon: 'image://' + flagMap[item.name] 
  }));

  // === 渲染堆叠柱状图 ===
  barChart.setOption({
    title: { text: '所有国家奖牌分布 (支持动态排序与滑动查看)', left: 'center' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['金牌', '银牌', '铜牌'], top: '30px', selected: activeLegends },
    grid: { left: '3%', right: '4%', bottom: '20%', containLabel: true },
    dataZoom: [
      { type: 'slider', show: true, xAxisIndex: [0], start: 0, end: 40, bottom: 0 },
      { type: 'inside', xAxisIndex: [0], zoomOnMouseWheel: true, moveOnMouseMove: true }
    ],
    xAxis: { 
      type: 'category', 
      data: countries,
      axisLabel: { 
        interval: 0, 
        // 【关键修复】使用生成的安全 ID 来做 formatter 匹配
        formatter: function (value) {
          const safeKey = safeIdMap[value] || 'value'; // 防御性兜底
          return '{' + safeKey + '| }\n{value|' + value + '}';
        },
        rich: xAxisRich
      }
    },
    yAxis: { type: 'value', name: '有效奖牌数' },
    series: [
      { name: '金牌', type: 'bar', stack: 'total', data: golds, itemStyle: { color: '#FFD700' } },
      { name: '银牌', type: 'bar', stack: 'total', data: silvers, itemStyle: { color: '#C0C0C0' } },
      { name: '铜牌', type: 'bar', stack: 'total', data: bronzes, itemStyle: { color: '#CD7F32', borderRadius: [4, 4, 0, 0] } }
    ]
  });

  // === 渲染饼图 ===
  pieChart.setOption({
    title: { text: '所有国家总奖牌分布占比', left: 'center' },
    tooltip: { trigger: 'item', formatter: '{b}: {c} 枚 ({d}%)' },
    legend: { 
      type: 'scroll', 
      orient: 'vertical', 
      right: 10, 
      top: 40, 
      bottom: 20,
      itemWidth: 28,  
      itemHeight: 18, 
      data: legendDataWithFlags
    },
    series: [
      {
        name: '总奖牌',
        type: 'pie',
        radius: ['45%', '70%'], 
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { 
            show: true, 
            // 【关键修复】饼图悬停也是同理，换用安全的 Key
            formatter: function(params) {
              const safeKey = safeIdMap[params.name] || 'nameStyle'; // 防御性兜底
              return '{' + safeKey + '| }\n{nameStyle|' + params.name + '}\n{valStyle|' + params.value + ' 枚}';
            },
            rich: pieRich
          }
        },
        labelLine: { show: false },
        data: pieData
      }
    ]
  });
}

// 3. 监听图例切换事件
barChart.on('legendselectchanged', function (params) {
  activeLegends = params.selected;
  updateCharts();
});

// 4. 监听排序按钮
// 注意：如果你的 index.html 没有 id 为 sort-btn 的元素，注释掉下面这段以防报错
const sortBtn = document.getElementById('sort-btn');
if (sortBtn) {
  sortBtn.addEventListener('click', (e) => {
    isDescending = !isDescending;
    e.target.innerText = isDescending ? '🔄 当前：降序排列' : '🔄 当前：升序排列';
    updateCharts();
  });
}

// 5. 监听窗口大小自适应
window.addEventListener('resize', () => {
  barChart.resize();
  pieChart.resize();
});

// 执行主程序
loadAndRenderData();