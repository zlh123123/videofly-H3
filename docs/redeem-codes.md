# Redeem code operations

管理员登录后可在 `/zh/admin/redeem-codes` 使用可视化后台生成和导出兑换码，并查看累计发行、当前可用、已兑换金额及最近 50 个批次的兑换进度。明文兑换码只在生成结果弹窗中出现一次，关闭前必须复制或下载 CSV；数据库和历史记录不会保存明文。

The admin endpoint creates one-time RMB balance codes. It returns plaintext codes once so an external Xianyu auto-delivery service can import them; the database stores only SHA-256 hashes.

```http
POST /api/v1/admin/redeem-codes/generate
Content-Type: application/json

{"count":10000,"faceValue":10,"expiresAt":"2027-12-31T23:59:59.000Z"}
```

The response contains `batchId` and `codes`. Keep the export private. A customer redeems a code with:

```http
POST /api/v1/credit/redeem
Content-Type: application/json

{"code":"ABCDE-FGHIJ-KLMNO-PQRST"}
```

Apply the SQL migration before using the endpoints. For production, keep the server as the source of truth and have the delivery app reserve codes through an authenticated admin integration rather than maintaining an independently mutable inventory.
