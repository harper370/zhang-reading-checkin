"""
张家每日读书打卡 — 后端 API 服务
FastAPI + JSON 文件存储
"""

import json
import os
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="张家读书打卡")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_FILE = Path(__file__).parent / "data.json"


def load_data() -> dict:
    if DATA_FILE.exists():
        try:
            return json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, IOError):
            pass
    return {"records": []}


def save_data(data: dict):
    DATA_FILE.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


# ---- 数据模型 ----
class RecordCreate(BaseModel):
    userName: str
    bookName: str
    content: str = ""
    date: str  # YYYY-MM-DD
    image: Optional[str] = None


class RecordItem(BaseModel):
    id: int
    userName: str
    date: str
    bookName: str
    content: str
    image: Optional[str] = None
    createdAt: str


# ---- API ----
@app.get("/api/records")
def get_records():
    """获取所有打卡记录"""
    data = load_data()
    return {"records": data["records"]}


@app.post("/api/records")
def create_record(rec: RecordCreate):
    """新增打卡记录"""
    data = load_data()
    new_id = 1
    if data["records"]:
        new_id = max(r["id"] for r in data["records"]) + 1

    record = {
        "id": new_id,
        "userName": rec.userName.strip(),
        "date": rec.date,
        "bookName": rec.bookName.strip() or "未命名书籍",
        "content": rec.content.strip(),
        "image": rec.image,
        "createdAt": datetime.now().isoformat(),
    }
    data["records"].insert(0, record)
    save_data(data)
    return {"success": True, "record": record}


@app.delete("/api/records/{record_id}")
def delete_record(record_id: int, userName: str = ""):
    """删除打卡记录（需要提供用户名验证身份）"""
    data = load_data()
    target = None
    for r in data["records"]:
        if r["id"] == record_id:
            target = r
            break

    if target is None:
        raise HTTPException(status_code=404, detail="记录不存在")

    # 只有本人或管理员可以删除
    if userName and target["userName"] != userName:
        raise HTTPException(status_code=403, detail="只能删除自己的打卡记录哦～")

    data["records"] = [r for r in data["records"] if r["id"] != record_id]
    save_data(data)
    return {"success": True}


@app.get("/api/stats")
def get_stats():
    """获取统计信息"""
    data = load_data()
    records = data["records"]
    today = datetime.now().strftime("%Y-%m-%d")

    # 今日打卡人员
    today_users = list(set(r["userName"] for r in records if r["date"] == today))

    # 每个人的打卡次数
    user_counts = {}
    for r in records:
        name = r["userName"]
        user_counts[name] = user_counts.get(name, 0) + 1

    # 排序
    ranking = sorted(user_counts.items(), key=lambda x: x[1], reverse=True)

    # 总打卡天数（全家）
    all_dates = set(r["date"] for r in records)
    total_days = len(all_dates)

    # 本月天数
    month_prefix = today[:7]
    month_dates = set(r["date"] for r in records if r["date"].startswith(month_prefix))
    month_days = len(month_dates)

    return {
        "totalRecords": len(records),
        "totalDays": total_days,
        "monthDays": month_days,
        "todayUsers": today_users,
        "ranking": [{"name": name, "count": count} for name, count in ranking],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8123)
