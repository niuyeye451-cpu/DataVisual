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

# 文件读取
from gree_model import GreeModel


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
    return data, label, mm_x, mm_y


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


# 定义一个类
class Net(nn.Module):
    def __init__(self, input_size, hidden_size, num_layers, mlp_hidden_size, batch_size,
                 seq_length) -> None:
        super(Net, self).__init__()
        self.input_size = input_size
        self.hidden_size = hidden_size
        self.num_layers = num_layers
        self.mlp_hidden_size = mlp_hidden_size
        self.batch_size = batch_size
        self.seq_length = seq_length
        self.num_directions = 1  # 单向LSTM

        self.lstm = nn.LSTM(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers,
                            batch_first=True)  # LSTM层

        # 添加MLP层
        self.mlp = nn.Sequential(
            nn.Linear(hidden_size, mlp_hidden_size),
            nn.ReLU(),
            nn.Linear(mlp_hidden_size, 1)
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


def result(model, x, y, mm_y):
    model.eval()
    train_predict = model(x)
    data_predict = train_predict.data.numpy()
    y_data_plot = y.data.numpy()
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


class LSTM_Model(GreeModel):
    def __init__(self, model_name):
        super().__init__(model_name)

        self.lr = 0.001

        self.split_ratio = 0.8
        self.n_iters = 6500

        self.mm_x = None
        self.mm_y = None
        self.x_data = None
        self.y_data = None
        self.x_test = None
        self.y_test = None
        self.train_loader = None
        self.test_loader = None
        self.num_epochs = None

        self.model_save_path = f'{self.model_save_directory}{self.model_name}.pth'

    def initial_model(self, **kwargs):
        self.model = Net(kwargs['input_size'], kwargs['hidden_size'], kwargs['num_layers'], kwargs['mlp_hidden_size'],
                         kwargs['batch_size'], kwargs['seq_length'])

        self.split_ratio = kwargs['split_ratio']
        self.n_iters = kwargs['n_iters']

        print(self.model)

    def prepare_dataset(self, data_path):
        data, label = get_Data(data_path)
        data, label, mm_x, mm_y = normalization(data, label)
        x, y = split_windows(data, self.model.seq_length)
        x_data, y_data, x_train, y_train, x_test, y_test = split_data(x, y, split_ratio=self.split_ratio)
        train_loader, test_loader, num_epochs = data_generator(x_train, y_train, x_test, y_test, self.n_iters,
                                                               self.model.batch_size)

        self.mm_x = mm_x
        self.mm_y = mm_y
        self.x_data = x_data
        self.y_data = y_data
        self.x_test = x_test
        self.y_test = y_test
        self.train_loader = train_loader
        self.test_loader = test_loader
        self.num_epochs = num_epochs

    def train(self):
        # 如果 save_path 中已经存在文件，就中止程序运行
        if os.path.isfile(self.model_save_path):
            print(f'{self.model_save_path} already exists')
            exit()

        criterion = torch.nn.L1Loss()

        optimizer = torch.optim.Adam(self.model.parameters(), lr=self.lr)

        # train
        iter = 0
        for epochs in range(self.num_epochs):
            for i, (batch_x, batch_y) in enumerate(self.train_loader):
                outputs = self.model(batch_x)
                optimizer.zero_grad()  # 将每次传播时的梯度累积清除
                loss = criterion(outputs, batch_y)  # 计算损失
                loss.backward()  # 反向传播
                optimizer.step()
                iter += 1
                if iter % 100 == 0:
                    print("iter: %d, loss: %1.5f" % (iter, loss.item()))

    def evaluation(self):
        self.model.eval()

        predict = self.model(self.x_test)
        predict = predict.data.numpy()
        predict = self.mm_y.inverse_transform(predict)

        label = self.y_test.data.numpy()
        label = np.reshape(label, (-1, 1))
        label = self.mm_y.inverse_transform(label)

        MAE = mean_absolute_error(label, predict)
        print('MAE: ', MAE)
        return MAE

    def visualization(self):
        result(self.model, self.x_data, self.y_data, self.mm_y)
        result(self.model, self.x_test, self.y_test, self.mm_y)

        def model_save(self):
            # 如果 save_path 中已经存在文件，就中止程序运行
            if os.path.isfile(self.model_save_path):
                print(f'{self.model_save_path} already exists')
                exit()

        checkpoint = {
            'model_state_dict': self.model.state_dict(),
            'init_args': {
                'input_size': self.model.input_size,
                'hidden_size': self.model.hidden_size,
                'num_layers': self.model.num_layers,
                'mlp_hidden_size': self.model.mlp_hidden_size,
                'batch_size': self.model.batch_size,
                'seq_length': self.model.seq_length,
                'split_ratio': self.split_ratio,
                'n_iters': self.n_iters,
            },
            'mm_x': self.mm_x,
            'mm_y': self.mm_y
        }

        torch.save(checkpoint, self.model_save_path)

    def model_load(self):
        # 加载已保存的字典
        checkpoint = torch.load(self.model_save_path)
        init_args = checkpoint['init_args']

        self.model = Net(init_args['input_size'], init_args['hidden_size'], init_args['num_layers'],
                         init_args['mlp_hidden_size'], init_args['batch_size'], init_args['seq_length'])
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.mm_x = checkpoint['mm_x']
        self.mm_y = checkpoint['mm_y']

        self.model.eval()

    def forecast(self, features):
        features = self.mm_x.transform(features)
        features = torch.from_numpy(features).float()
        # 给 features 增加一个维度
        features = features.unsqueeze(dim=0)
        y = self.model(features)
        y = y.data.numpy()
        y = self.mm_y.inverse_transform(y)
        y = y[0][0]
        print(f'forecast value: {y}')
        return y
