import numpy as np
import torch
import pandas as pd
import torch.nn as nn
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import accuracy_score, r2_score, mean_absolute_error, mean_squared_error
from sklearn.model_selection import train_test_split
import torch.optim as optim
import matplotlib.pyplot as plt
from sklearn.metrics import confusion_matrix

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


# Split the DataFrame into features (X) and the target variable (y)
X_data = df.drop(columns=['hourly_load'])
y_data = df['hourly_load']

print(X_data.head())
print(y_data.head())

# 先查找最适阈值
threshold = 300
y_data_category = y_data.copy()  # 复制一份y_train
# 根据阈值重新分配类别
# 大于该阈值的化为1类，小于该阈值的化为0类
y_data_category[y_data_category < threshold] = 0
y_data_category[y_data_category >= threshold] = 1

# 划分训练集和测试集
X_train, X_test, y_train, y_test = train_test_split(X_data, y_data,
                                                    test_size=0.2, random_state=2023)
# X_test_end = X_test.copy() # 拷贝一份dataframe用于最后测试
# 先划分训练集测试集后再进行二类划分
y_train_1 = y_train.copy()
y_test_1 = y_test.copy()
y_train_1[y_train_1 < threshold] = 0
y_train_1[y_train_1 >= threshold] = 1
y_test_1[y_test_1 < threshold] = 0
y_test_1[y_test_1 >= threshold] = 1

X_train = X_train.to_numpy()
X_test = X_test.to_numpy()
y_train_1 = y_train_1.to_numpy()
y_test_1 = y_test_1.to_numpy()
y_test = y_test.to_numpy()

# 转换为PyTorch张量
X_train_tensor = torch.tensor(X_train, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train_1, dtype=torch.long)  # 由于类别是整数，使用长整型数据类型
X_test_tensor = torch.tensor(X_test, dtype=torch.float32)
y_test_tensor = torch.tensor(y_test_1, dtype=torch.long)


class Zeroize(nn.Module):
    def __init__(self, input_dim, hidden_dim, hidden_dim2 ,output_dim):
        super(Zeroize, self).__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.05),
            nn.Linear(hidden_dim, hidden_dim2),
            nn.ReLU(),
            nn.Linear(hidden_dim2, output_dim)
        )

    def forward(self, x):
        return self.layers(x)


# 设置模型参数
input_size = X_train.shape[1]
hidden_size = 16
hidden_size2 = 4
num_classes = 2
num_epochs = 2000  # 应该为2000
batch_size = 64
learning_rate = 0.001

# 初始化模型和优化器
model = Zeroize(input_size, hidden_size, hidden_size2, num_classes)
optimizer = optim.Adam(model.parameters(), lr=learning_rate)
criterion = nn.CrossEntropyLoss()

# 训练模型
for epoch in range(num_epochs):
    for i in range(0, len(X_train_tensor), batch_size):
        # 获取当前批次的数据和标签
        inputs = X_train_tensor[i:i + batch_size]
        labels = y_train_tensor[i:i + batch_size]

        # 前向传播
        outputs = model(inputs)
        loss = criterion(outputs, labels)

        # 反向传播和优化
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    # 每训练 10 个 epoch 打印一次损失值
    if (epoch + 1) % 10 == 0:
        print(f'Epoch [{epoch + 1}/{num_epochs}], Loss: {loss.item()}')

# 使用.values获取DataFrame的值数组，并转换为张量
X_data_tensor = torch.tensor(X_data.values, dtype=torch.float32)

with torch.no_grad():
    predictions = model(X_data_tensor).argmax(dim=1)

predictions = predictions.numpy()

X_data_0 = X_data[predictions == 0]
X_data_1 = X_data[predictions == 1]
y_data_1 = y_data[predictions == 1]

X_train_step2, X_test_step2, y_train_step2, y_test_step2 = train_test_split(X_data_1, y_data_1,
                                                                            test_size=0.2, random_state=2023)

rfs = RandomForestRegressor() # 模型参数有待优化

rfs.fit(X_train_step2, y_train_step2)  # 分类不为0的扔进随机森林进行训练

y_pred_step2 = rfs.predict(X_test_step2)

print("--------以下是随机森林部分的评估结果--------")
print("R square :", r2_score(y_test_step2, y_pred_step2))
print("MAE :", mean_absolute_error(y_test_step2, y_pred_step2))
print("MSE :", mean_squared_error(y_test_step2, y_pred_step2))
print("RMSE :", mean_squared_error(y_test_step2, y_pred_step2) ** 0.5)
print("----------------------------------------")

# # 预测


model.eval()  # 切换为评估模式
with torch.no_grad():
    outputs = model(X_test_tensor)
    _, predictions_1 = torch.max(outputs.data, 1)

end_predictions = torch.zeros_like(y_test_tensor)
predictions_1 = predictions_1.numpy()
print(predictions_1)

for i in range(len(end_predictions)):
    if predictions_1[i] == 0:
        # MLP为0时直接输出
        end_predictions[i] = 0
    else:
        # 逐行访问预测
        # print(X_test_end.iloc[i])
        temp = rfs.predict(X_test[i].reshape(1, -1))
        end_predictions[i] = torch.from_numpy(temp).long()  # 转换为tensor张量再赋值
    # print(f"第{i}个元素真实值是{y_test[i]}")
    # print(f"第{i}个元素预测值是{end_predictions[i]}")

print(end_predictions)

# save end_predictions to local csv file
end_predictions = end_predictions.numpy()
end_predictions = pd.DataFrame(end_predictions)
end_predictions.to_csv("end_predictions.csv")

# 模型综合效果
print("R square :", r2_score(y_test, end_predictions))
print("MAE :", mean_absolute_error(y_test, end_predictions))
print("MSE :", mean_squared_error(y_test, end_predictions))
print("RMSE :", mean_squared_error(y_test, end_predictions) ** 0.5)


# ---- 百分比误差计算 ----
y_pred_values = end_predictions.values.squeeze()
# 1. 删除 y_test 中值小于 500 的对应位置的值，同时删除 y_pred_values 中的相应值
mask = y_test >= 500  # 创建一个布尔掩码，True 表示值大于等于 500，False 表示小于 500
y_test_filtered = y_test[mask]  # 使用掩码筛选 y_test 中的值
y_pred_filtered = y_pred_values[mask]  # 使用掩码筛选 y_pred_values 中的值

mask = y_pred_filtered != 0
y_pred_not_zero = y_pred_filtered[mask]

print(f"有效预测个数 : {len(y_pred_filtered)}，其中错误预测为 0 的个数 :{len(y_pred_filtered) - len(y_pred_not_zero)}")

# 2. 计算对应值的百分比误差
percentage_error = np.abs(y_test_filtered - y_pred_filtered) / np.abs(y_test_filtered) * 100
# 3. 计算平均百分比误差
mean_percentage_error = np.mean(percentage_error)
print(f"平均百分比误差 : {mean_percentage_error}")

# Create a scatter plot
plt.scatter(y_test, end_predictions, alpha=0.5)
plt.xlabel('True Values')
plt.ylabel('Predictions')
plt.title('Actual vs. Predicted Values: MLP + RandomForest')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'k--', lw=2)
plt.show()

print("end---")
