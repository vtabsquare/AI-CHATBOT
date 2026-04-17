import os, uuid, json, shutil

class StorageService:
    def __init__(self, base_dir="data_store"):
        self.base_path = os.path.join(base_dir, "workspaces")
        os.makedirs(self.base_path, exist_ok=True)

    def create_ws(self, name):
        ws_id = str(uuid.uuid4())[:8]
        path = os.path.join(self.base_path, ws_id)
        for folder in ["uploads", "vectors"]:
            os.makedirs(os.path.join(path, folder), exist_ok=True)
        meta = {"id": ws_id, "name": name}
        with open(os.path.join(path, "metadata.json"), "w") as f:
            json.dump(meta, f)
        return meta

    def delete_ws_storage(self, ws_id):
        path = os.path.join(self.base_path, ws_id)
        if os.path.exists(path):
            shutil.rmtree(path)
            return True
        return False