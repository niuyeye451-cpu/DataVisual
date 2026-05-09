from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeRegressor
import pandas as pd
import numpy as np
from sklearn.metrics import r2_score,mean_absolute_error,mean_squared_error
import matplotlib.pyplot as plt
import graphviz
from sklearn import tree

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

# Split the data into training and test sets (80% for training, 20% for testing)
X_train, X_test, y_train, y_test = train_test_split(X_train, y_train, test_size=0.2, random_state=2023)
dtr = DecisionTreeRegressor()
dtr.fit(X_train,y_train)


y_pred=dtr.predict(X_test)


print("R square :",r2_score(y_test,y_pred))
print("MAE :",mean_absolute_error(y_test,y_pred))
print("MSE :",mean_squared_error(y_test,y_pred))
print("RMSE :",mean_squared_error(y_test,y_pred)**0.5)

# Create a scatter plot
# 预测值与真实值的散点图：绘制预测值与真实值之间的散点图，
plt.scatter(y_test, y_pred, alpha=0.5)
plt.xlabel('True Values')
plt.ylabel('Predictions')
plt.title('Actual vs. Predicted Values')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'k--', lw=2)
plt.show()


# 特征重要性图（Feature Importance plot）：决策树模型可以提供每个特征的重要性指标
feature_importance = dtr.feature_importances_
sorted_indices = np.argsort(feature_importance)
labels = X_train.columns[sorted_indices]

plt.barh(range(len(feature_importance)), feature_importance[sorted_indices])
plt.yticks(range(len(feature_importance)), labels)
plt.xlabel('Feature Importance')
plt.title('Feature Importance Plot')
plt.show()



# # 生成决策树可视化图形
# dot_data = tree.export_graphviz(dtr, out_file=None,
#                                 feature_names=X_train.columns,
#                                 filled=True, rounded=True,
#                                 special_characters=True)
#
# graph = graphviz.Source(dot_data)
# graph.render("decision_tree", format="ng")  # 将可视化图形保存为PNG格式文件
# graph.view()  # 在窗口中显示决策树图形


# 残差图（Residual Plot）：绘制真实值与预测值之间的差异
residuals = y_test - y_pred
plt.scatter(y_test, residuals)
plt.axhline(y=0, color='r', linestyle='--')
plt.xlabel('True Values')
plt.ylabel('Residuals')
plt.title('Residual Plot')
plt.show()

# 学习曲线（Learning Curve）：学习曲线是通过绘制训练集和验证集上的模型性能随着样本数量增加而变化的曲线图。
from sklearn.model_selection import learning_curve
train_sizes, train_scores, val_scores = learning_curve(dtr, X_train, y_train, cv=5)
train_mean = np.mean(train_scores, axis=1)
train_std = np.std(train_scores, axis=1)
val_mean = np.mean(val_scores, axis=1)
val_std = np.std(val_scores, axis=1)

plt.plot(train_sizes, train_mean, label='Training Score')
plt.plot(train_sizes, val_mean, label='Validation Score')
plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.2)
plt.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.2)
plt.xlabel('Training Set Size')
plt.ylabel('Score')
plt.title('Learning Curve')
plt.legend(loc='best')
plt.show()



# linear regression模型
# from sklearn.linear_model import LinearRegression
# lr=LinearRegression()
# lr.fit(X_train,y_train)
# y_pred2=lr.predict(X_test)
#
#
# print("R square :",r2_score(y_test,y_pred2))
# print("MAE :",mean_absolute_error(y_test,y_pred2))
# print("MSE :",mean_squared_error(y_test,y_pred2))
# print("RMSE :",mean_squared_error(y_test,y_pred2)**0.5)


