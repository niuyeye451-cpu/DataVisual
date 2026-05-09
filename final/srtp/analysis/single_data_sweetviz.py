import pandas as pd
import sweetviz as sv

df = pd.read_excel("../raw_data/2018年7-8月逐时数据_attention.xlsx")
new_column_names = {
    '记录时间': 'time',
    '太阳辐射W/㎡': 'radiation',
    '室外温度℃': 'temperature',
    '相对湿度％': 'relative_humidity',
    'L(h-24)': 'L_h_minus_24',
    'L(h-1)': 'L_h_minus_1',
    'T(h-1)': 'T_h_minus_1',
    '能源站负荷KW': 'hourly_load'
}

# df = pd.read_excel("../raw_data/2022年1月负荷数据_attention.xlsx")
# new_column_names = {
#     '时间': 'time',
#     '温度': 'temperature',
#     '相对湿度': 'relative_humidity',
#     'L(h-24)': 'L_h_minus_24',
#     'L(h-1)': 'L_h_minus_1',
#     'T（h-1）': 'T_h_minus_1',
#     '逐时负荷（kwh）': 'hourly_load'
# }

# Use the rename() method to rename the columns
df = df.rename(columns=new_column_names)

# 解析日期时间并提取信息
df['time'] = pd.to_datetime(df['time'], format='%Y/%m/%d %H:%M')
df['month'] = df['time'].dt.month
df['day_of_month'] = df['time'].dt.day
df['day_of_week'] = df['time'].dt.dayofweek
df['hour'] = df['time'].dt.hour

# 移除一些不再需要的列
df = df.drop(columns=['time'])

my_report = sv.analyze(source=df,
                       target_feat='hourly_load')
my_report.show_html(filepath='2018年7-8月逐时数据_REPORT.html')  # Default arguments will generate to "SWEETVIZ_REPORT.html"
