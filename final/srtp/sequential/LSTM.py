import os
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error
from sklearn.metrics import mean_absolute_error
import torch
from torch import nn, optim
from torch.autograd import Variable
from torch.utils.data import DataLoader
import torch.utils.data as Data
from torchvision import transforms, datasets


# 文件读取
def get_Data(data_path):
    data = pd.read_excel(data_path)
    label = data.iloc[:, 9:]  # 选择最后一列作为标签
    data = data.iloc[:, 1:]  # 选择除第一列以外的特征作为数据
    print(data.head())
    print(label.head())
    return data, label


# 数据预处理
def normalization(data, label):
    mm_x = MinMaxScaler()  # 导入sklearn的预处理容器
    mm_y = MinMaxScaler()
    data = data.values  # 将pd的系列格式转换为np的数组格式
    label = label.values
    data = mm_x.fit_transform(data)  # 对数据和标签进行归一化等处理
    label = mm_y.fit_transform(label)
    return data, label, mm_y


# 时间向量转换
def split_windows(data, seq_length):
    x = []
    y = []
    for i in range(len(data) - seq_length - 1):  # range的范围需要减去时间步长和1
        _x = data[i:(i + seq_length), :]
        _y = data[i + seq_length, -1]
        x.append(_x)
        y.append(_y)
    x, y = np.array(x), np.array(y)
    print('x.shape,y.shape=\n', x.shape, y.shape)
    return x, y


# 数据分离
def split_data(x, y, split_ratio):
    train_size = int(len(y) * split_ratio)
    test_size = len(y) - train_size

    x_data = Variable(torch.Tensor(np.array(x)))
    y_data = Variable(torch.Tensor(np.array(y)))
    x_train = Variable(torch.Tensor(np.array(x[0:train_size])))
    y_train = Variable(torch.Tensor(np.array(y[0:train_size])))
    y_test = Variable(torch.Tensor(np.array(y[train_size:len(y)])))
    x_test = Variable(torch.Tensor(np.array(x[train_size:len(x)])))

    print('x_data.shape,y_data.shape,x_train.shape,y_train.shape,x_test.shape,y_test.shape:\n{}{}{}{}{}{}'
          .format(x_data.shape, y_data.shape, x_train.shape, y_train.shape, x_test.shape, y_test.shape))

    return x_data, y_data, x_train, y_train, x_test, y_test


# 数据装入
def data_generator(x_train, y_train, x_test, y_test, n_iters, batch_size):
    num_epochs = n_iters / (len(x_train) / batch_size)  # n_iters代表一次迭代
    num_epochs = int(num_epochs)
    train_dataset = Data.TensorDataset(x_train, y_train)
    test_dataset = Data.TensorDataset(x_test, y_test)
    train_loader = torch.utils.data.DataLoader(dataset=train_dataset, batch_size=batch_size, shuffle=False,
                                               drop_last=True)  # 加载数据集,使数据集可迭代
    test_loader = torch.utils.data.DataLoader(dataset=test_dataset, batch_size=batch_size, shuffle=False,
                                              drop_last=True)

    return train_loader, test_loader, num_epochs


# 定义模型
from turtle import forward
import torch.nn as nn
import torch.nn.functional as F


# 定义一个类
class Net(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, mlp_hidden_size, output_size, batch_size,
                 seq_length) -> None:
        super(Net, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.mlp_hidden_size = mlp_hidden_size
        self.output_size = output_size
        self.batch_size = batch_size
        self.seq_length = seq_length
        self.num_directions = 1  # 单向LSTM

        self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers,
                            batch_first=True)  # LSTM层

        # 添加MLP层
        self.mlp = nn.Sequential(
            nn.Linear(hidden_size, mlp_hidden_size),
            nn.ReLU(),
            nn.Linear(mlp_hidden_size, output_size)
        )

    def forward(self, x):
        # LSTM前向传播
        batch_size, seq_len = x.size()[0], x.size()[1]  # x.shape=(604,3,3)
        h_0 = torch.randn(self.num_directions * self.num_layers, x.size(0), self.hidden_size)
        c_0 = torch.randn(self.num_directions * self.num_layers, x.size(0), self.hidden_size)
        # output(batch_size, seq_len, num_directions * hidden_size)
        lstm_out, _ = self.lstm(x, (h_0, c_0))  # output(5, 30, 64)

        # MLP前向传播
        mlp_output = self.mlp(lstm_out)
        mlp_output = mlp_output[:, -1, :]

        return mlp_output


# 参数设置
seq_length = 25  # 时间步长25
input_size = 9
num_layers = 1  # 1
hidden_size = 32  # 128
mlp_hidden_size = 256  # 256
batch_size = 5  # 5
n_iters = 6500
lr = 0.001  # 0.001
output_size = 1
split_ratio = 0.8
path = '../raw_data/负荷预测数据_调整.xlsx'
moudle = Net(input_size, hidden_size, num_layers, mlp_hidden_size, output_size, batch_size,
             seq_length)
# MAELoss
criterion = torch.nn.L1Loss()

optimizer = torch.optim.Adam(moudle.parameters(), lr=lr)
print(moudle)

# 数据导入
data, label = get_Data(path)
data, label, mm_y = normalization(data, label)
x, y = split_windows(data, seq_length)
x_data, y_data, x_train, y_train, x_test, y_test = split_data(x, y, split_ratio)
train_loader, test_loader, num_epochs = data_generator(x_train, y_train, x_test, y_test, n_iters, batch_size)

# train
iter = 0
for epochs in range(num_epochs):
    for i, (batch_x, batch_y) in enumerate(train_loader):
        outputs = moudle(batch_x)
        optimizer.zero_grad()  # 将每次传播时的梯度累积清除
        # print(outputs.shape, batch_y.shape)
        loss = criterion(outputs, batch_y)  # 计算损失
        loss.backward()  # 反向传播
        optimizer.step()
        iter += 1
        if iter % 100 == 0:
            print("iter: %d, loss: %1.5f" % (iter, loss.item()))


def result(x_data, y_data):
    moudle.eval()
    train_predict = moudle(x_data)
    data_predict = train_predict.data.numpy()
    y_data_plot = y_data.data.numpy()
    y_data_plot = np.reshape(y_data_plot, (-1, 1))
    data_predict = mm_y.inverse_transform(data_predict)
    y_data_plot = mm_y.inverse_transform(y_data_plot)
    print('MAE/RMSE')
    print(mean_absolute_error(y_data_plot, data_predict))
    print(np.sqrt(mean_squared_error(y_data_plot, data_predict)))
    plt.plot(y_data_plot)
    plt.plot(data_predict)
    plt.legend(('real', 'predict'), fontsize='15')
    plt.show()

    # ---- 平均百分比误差计算 ----
    y_true_values = y_data_plot.squeeze()
    y_pred_values = data_predict.squeeze()
    mask = y_true_values >= 500
    y_true_values = y_true_values[mask]
    y_pred_values = y_pred_values[mask]

    percentage_error = np.abs((y_true_values - y_pred_values) / y_true_values) * 100
    mean_percentage_error = np.mean(percentage_error)
    print('平均百分比误差: ', mean_percentage_error)


result(x_data, y_data)
result(x_test, y_test)
