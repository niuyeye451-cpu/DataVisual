# Multilayer Perception
import torch
import torch.nn as nn
import torch.optim as optim
from sklearn.metrics import r2_score
from sklearn.model_selection import train_test_split
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from sklearn.preprocessing import MinMaxScaler

# 选择gpu或cpu
device = 'cuda' if torch.cuda.is_available() else 'cpu'
print('Using {} device'.format(device))


# Read the Excel file into a pandas DataFrame
df = pd.read_excel("../raw_data/负荷预测数据.xlsx")

# Drop any unnecessary columns (if needed)
# For example, to drop the '日期因子' column, you can use:
# df = df.drop(columns=['相对湿度%'])
df = df.drop(columns=df.columns[0])  # Drop the first column (by index)

# Create a dictionary to map current column names to new column names
new_column_names = {
    '日期因子': 'day',
    '星期因子映射': 'week',
    '辐射强度': 'radiation',
    '温度 °C ': 'temperature',
    '相对湿度%': 'relative_humidity',
    'L(h-24)': 'L_h_minus_24',
    'L(h-1)': 'L_h_minus_1',
    'T(h-1)': 'T_h_minus_1',
    '逐时负荷/kWh': 'hourly_load'
}

# Use the rename() method to rename the columns
df = df.rename(columns=new_column_names)


# Split the DataFrame into features (X) and the target variable (y)
X_train = df.drop(columns=['hourly_load'])
y_train = df['hourly_load']

# Perform normalization on the training set
# 特征值归一化处理
scaler = MinMaxScaler()  # Initialize the scaler
X_train_normalized = scaler.fit_transform(X_train)  # Normalize X_train

# Convert DataFrame to tensors
X_train_tensor = torch.tensor(X_train.values, dtype=torch.float32)
y_train_tensor = torch.tensor(y_train.values, dtype=torch.float32)

# Split the data into training and test sets (80% for training, 20% for testing)
X_train_tensor, X_test_tensor, y_train_tensor, y_test_tensor = train_test_split(X_train_tensor, y_train_tensor,
                                                                                test_size=0.2, random_state=2023)
# print(X_train_tensor.shape(), X_test_tensor.shape(), y_train_tensor.shape(), y_test_tensor.shape())


class MLP(nn.Module):
    def __init__(self, input_dim, hidden_dim1, hidden_dim2, hidden_dim3, output_dim):
        super(MLP, self).__init__()
        # 把网络加深，基本上到 4 层就差不多了
        # 启用 dropout
        # 修改中间层的维度
        # self.fc1 = nn.Linear(input_dim, hidden_dim)
        # self.fc2 = nn.Linear(hidden_dim, output_dim)
        self.layers = nn.Sequential(
            nn.Linear(input_dim, hidden_dim1),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim1, hidden_dim2),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim2, hidden_dim3),
            nn.ReLU(),
            nn.Linear(hidden_dim3, output_dim)
        )


    def forward(self, x):
        return self.layers(x)


input_layer = 8  # 输入层，有多少个输入
hidden_layer1 = 32  # 隐藏层1，神经元个数
hidden_layer2 = 16  # 隐藏层2， 神经元
hidden_layer3 = 4  # 隐藏层3， 神经元
output_layer = 1  # 输出维度，预测问题中则为 1
learning_rate = 0.001  # 学习率
num_epochs = 2000  # 迭代次数
batch_size = 128  # 批处理大小

model = MLP(input_layer, hidden_layer1, hidden_layer2, hidden_layer3, output_layer)
model = model.to(device)  # 模型迁移

criterion = torch.nn.MSELoss()
# optimizer = optim.Adam(model.parameters(), lr=learning_rate, weight_decay=0.001)  # 优化器选择
optimizer = optim.Adam(model.parameters(), lr=learning_rate)  # 优化器选择

# 开始迭代
for epoch in range(num_epochs):

    for i in range(0, len(X_train_tensor), batch_size):
        batch_X = X_train_tensor[i:i + batch_size]
        batch_X = batch_X.to(device)
        batch_y = y_train_tensor[i:i + batch_size]
        batch_y = batch_y.to(device)

        # 梯度清零
        optimizer.zero_grad()
        outputs = model(batch_X)
        loss = criterion(torch.squeeze(outputs), batch_y)
        # print(loss.device)
        # Perform backward pass
        loss.backward()

        # 查看梯度
        # grads = []
        # for name, param in model.named_parameters():
        #     if param.grad is not None:
        #         grads.append(param.grad.norm().item())

        # 更新参数
        optimizer.step()

    if (epoch + 1) % 100 == 0:
        loss = loss.detach().cpu().numpy()
        print('Epoch [{}/{}], Loss: {:.4f}'.format(epoch + 1, num_epochs, loss.item()))
        # 打印或记录每个参数的梯度大小
        # print("Gradient sizes:", grads)

# 将测试数据转换为张量
X_test_tensor = torch.Tensor(X_test_tensor)
X_test_tensor = X_test_tensor.to(device)
y_test_tensor = torch.Tensor(y_test_tensor)
y_test_tensor = y_test_tensor.to(device)



# 对模型进行评估
model.eval()
with torch.no_grad():
    # 计算模型的预测结果
    predictions = model(X_test_tensor)

    # 计算平均绝对误差（MAE）
    mae = torch.mean(torch.abs(predictions - y_test_tensor))

    # 将 MAE 转换为 numpy 数组
    mae = mae.item()


print("MAE:", mae)

# 对模型进行评估
model.eval()
with torch.no_grad():
    # 计算模型的预测结果
    predictions = model(X_test_tensor)

    # 将预测结果和真实值转换为 numpy 数组
    predictions_np = predictions.cpu().numpy()
    y_test_np = y_test_tensor.cpu().numpy()

    # 计算 R2 分数
    r2 = r2_score(y_test_np, predictions_np)

print("R2 Score:", r2)


X_train_tensor = X_train_tensor.to(device)
# 生成模型的预测结果和实际标签
with torch.no_grad():
    predicted = model(X_train_tensor).detach().cpu().numpy()

# y_train = y_train.detach().cpu().numpy()
# predicted = predicted.detach().cpu().numpy()

plt.plot(range(len(y_train)), y_train, label='Actual')
plt.plot(range(len(predicted)), predicted, label='Predicted')
plt.xlabel('Data Points')
plt.ylabel('Value')
plt.legend()
plt.show()
