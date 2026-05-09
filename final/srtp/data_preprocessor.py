import pandas as pd
from sklearn.model_selection import train_test_split

# Read the Excel file into a pandas DataFrame
df = pd.read_excel("./raw_data/负荷预测数据.xlsx")

# Drop any unnecessary columns (if needed)
# For example, to drop the '日期因子' column, you can use:
# df = df.drop(columns=['日期因子'])
df = df.drop(columns=df.columns[0])  # Drop the first column (by index)

# Split the DataFrame into features (X) and the target variable (y)
X = df.drop(columns=['逐时负荷/kWh'])
y = df['逐时负荷/kWh']

# Split the data into training and test sets (80% for training, 20% for testing)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=2023)

print(len(X_train))

# Perform any additional preprocessing, normalization, etc., on the training and test sets

# Now, X_train and y_train contain the features and target variable for training,
# and X_test and y_test contain the features and target variable for testing.
