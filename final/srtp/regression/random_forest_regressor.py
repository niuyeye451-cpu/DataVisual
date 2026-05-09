import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score,mean_absolute_error,mean_squared_error
import matplotlib.pyplot as plt
import numpy as np

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


# ML model"
forest = RandomForestRegressor(n_estimators = 48, random_state = 2023, max_depth=17, criterion="poisson", min_samples_split=4)
forest.fit(X_train, y_train)

y_pred=forest.predict(X_test)


# # 交叉验证
from sklearn.model_selection import cross_val_score
# forest_s = cross_val_score(forest, X_train, y_train, cv=10)
# plt.plot(range(1,11), forest_s, label = "RandowForest")
# plt.legend()
# plt.show()



print("R square :",r2_score(y_test,y_pred))
print("MAE :",mean_absolute_error(y_test,y_pred))
print("MSE :",mean_squared_error(y_test,y_pred))
print("RMSE :",mean_squared_error(y_test,y_pred)**0.5)


# 可视化n_estimators对预测精确性（模型效果）的影响，该参数的意义：The number of trees in the forest.即决策树中建立的树
# 这段代码跑一次时间很长
superpa = []
for i in range(200):
    rfc = RandomForestRegressor(n_estimators = i+1, n_jobs=-1,  random_state = 2023, max_depth=19, criterion="poisson", min_samples_split=4)
    rfc_s = cross_val_score(rfc, X_train, y_train, cv=10).mean()
    print(i, rfc_s)
    superpa.append(rfc_s)
print(max(superpa), superpa.index(max(superpa)))    # 0.972615508953966 104
plt.figure(figsize=[20,5])
plt.plot(range(1,201), superpa)
plt.show()



# # 以下是绘图  ##### Create a scatter plot
plt.scatter(y_test, y_pred, alpha=0.5)
plt.xlabel('True Values')
plt.ylabel('Predictions')
plt.title('Actual vs. Predicted Values')
plt.plot([y_test.min(), y_test.max()], [y_test.min(), y_test.max()], 'k--', lw=2)
plt.show()

#
#
# # 查看特征重要性
# feature_importance = forest.feature_importances_
# sorted_indices = np.argsort(feature_importance)
# labels = X_train.columns[sorted_indices]
#
# plt.barh(range(len(feature_importance)), feature_importance[sorted_indices])
# plt.yticks(range(len(feature_importance)), labels)
# plt.xlabel('Feature Importance')
# plt.title('Feature Importance Plot')
# plt.show()
#
#
# # 学习曲线（Learning Curve）：学习曲线是通过绘制训练集和验证集上的模型性能随着样本数量增加而变化的曲线图。
# from sklearn.model_selection import learning_curve
# train_sizes, train_scores, val_scores = learning_curve(forest, X_train, y_train, cv=5)
# train_mean = np.mean(train_scores, axis=1)
# train_std = np.std(train_scores, axis=1)
# val_mean = np.mean(val_scores, axis=1)
# val_std = np.std(val_scores, axis=1)
#
# plt.plot(train_sizes, train_mean, label='Training Score')
# plt.plot(train_sizes, val_mean, label='Validation Score')
# plt.fill_between(train_sizes, train_mean - train_std, train_mean + train_std, alpha=0.2)
# plt.fill_between(train_sizes, val_mean - val_std, val_mean + val_std, alpha=0.2)
# plt.xlabel('Training Set Size')
# plt.ylabel('Score')
# plt.title('Learning Curve')
# plt.legend(loc='best')
# plt.show()
