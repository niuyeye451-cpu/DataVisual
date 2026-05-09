class GreeModel:
    def __init__(self, model_name):
        self.model_name = model_name
        self.model = None
        self.model_save_directory = './model_save/'

    def initial_model(self, **kwargs):
        raise NotImplementedError("Subclasses should implement initial_model()")

    def prepare_dataset(self, data_path):
        raise NotImplementedError("Subclasses should implement prepare_dataset()")

    def train(self):
        raise NotImplementedError("Subclasses should implement train()")

    def evaluation(self):
        raise NotImplementedError("Subclasses should implement evaluation()")

    def model_save(self):
        raise NotImplementedError("Subclasses should implement model_save()")

    def model_load(self):
        raise NotImplementedError("Subclasses should implement model_load()")

    def forecast(self, features):
        raise NotImplementedError("Subclasses should implement forecast()")
