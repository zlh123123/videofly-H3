"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  KeyRound,
  Loader2,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BatchSummary {
  batchId: string;
  faceValue: number;
  totalCount: number;
  availableCount: number;
  redeemedCount: number;
  expiresAt: string | null;
  createdAt: string;
}

interface GeneratedBatch {
  batchId: string;
  codes: string[];
  faceValue: number;
  expiresAt: string | null;
}

interface RedeemCodeManagerProps {
  summary: {
    total: number;
    available: number;
    redeemed: number;
    redeemedValue: number;
  };
  batches: BatchSummary[];
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function StatCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export function RedeemCodeManager({
  summary,
  batches,
}: RedeemCodeManagerProps) {
  const router = useRouter();
  const [count, setCount] = useState(100);
  const [faceValue, setFaceValue] = useState(10);
  const [expiresAt, setExpiresAt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedBatch | null>(null);

  const generationValue = useMemo(
    () => Math.max(0, count) * Math.max(0, faceValue),
    [count, faceValue]
  );

  async function generateCodes(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!Number.isInteger(count) || count < 1 || count > 100_000) {
      toast.error("生成数量必须是 1 到 100000 之间的整数");
      return;
    }
    if (!Number.isInteger(faceValue) || faceValue < 1) {
      toast.error("人民币面值必须是正整数");
      return;
    }

    const expiry = expiresAt ? new Date(expiresAt) : null;
    if (expiry && expiry <= new Date()) {
      toast.error("有效期必须晚于当前时间");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/v1/admin/redeem-codes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          count,
          faceValue,
          expiresAt: expiry?.toISOString() ?? null,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error?.message || "兑换码生成失败");
      }

      setGenerated({
        batchId: payload.data.batchId,
        codes: payload.data.codes,
        faceValue,
        expiresAt: expiry?.toISOString() ?? null,
      });
      toast.success(`已生成 ${payload.data.codes.length} 个兑换码`);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "兑换码生成失败");
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadCsv() {
    if (!generated) return;
    const rows = [
      ["兑换码", "人民币面值", "批次号", "有效期"],
      ...generated.codes.map((code) => [
        code,
        String(generated.faceValue),
        generated.batchId,
        generated.expiresAt ?? "永久有效",
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" })
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${generated.batchId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function copyCodes() {
    if (!generated) return;
    await navigator.clipboard.writeText(generated.codes.join("\n"));
    toast.success("兑换码已复制到剪贴板");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">兑换码管理</h1>
        <p className="text-muted-foreground">
          批量发行人民币余额兑换码，并查看兑换进度
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="累计发行"
          value={summary.total.toLocaleString("zh-CN")}
          description="数据库中的兑换码总数"
        />
        <StatCard
          label="当前可用"
          value={summary.available.toLocaleString("zh-CN")}
          description="尚未兑换且仍在有效期内"
        />
        <StatCard
          label="已兑换"
          value={summary.redeemed.toLocaleString("zh-CN")}
          description="已经成功充值的兑换码"
        />
        <StatCard
          label="已充值金额"
          value={`¥${summary.redeemedValue.toLocaleString("zh-CN")}`}
          description="通过兑换码累计充值"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,420px)_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              生成新批次
            </CardTitle>
            <CardDescription>
              每批最多 100000 个，系统每 1000 个分批写入数据库
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-5" onSubmit={generateCodes}>
              <div className="space-y-2">
                <Label htmlFor="redeem-count">生成数量</Label>
                <Input
                  id="redeem-count"
                  type="number"
                  min={1}
                  max={100000}
                  step={1}
                  value={count}
                  onChange={(event) => setCount(event.target.valueAsNumber || 0)}
                />
                <div className="flex flex-wrap gap-2">
                  {[100, 1000, 10000].map((preset) => (
                    <Button
                      key={preset}
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => setCount(preset)}
                    >
                      {preset.toLocaleString("zh-CN")}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redeem-value">人民币面值</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    ¥
                  </span>
                  <Input
                    id="redeem-value"
                    className="pl-7"
                    type="number"
                    min={1}
                    step={1}
                    value={faceValue}
                    onChange={(event) =>
                      setFaceValue(event.target.valueAsNumber || 0)
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="redeem-expiry">有效期（可选）</Label>
                <Input
                  id="redeem-expiry"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  留空表示永久有效
                </p>
              </div>

              {count > 20_000 ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>大批量生成</AlertTitle>
                  <AlertDescription>
                    生成和下载可能需要一些时间，请勿重复提交或关闭页面。
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="rounded-lg border bg-muted/40 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">本批总面值</span>
                  <span className="font-semibold tabular-nums">
                    ¥{generationValue.toLocaleString("zh-CN")}
                  </span>
                </div>
              </div>

              <Button className="w-full" type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <WalletCards className="h-4 w-4" />
                )}
                {isGenerating ? "正在生成..." : "生成兑换码"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="min-w-0">
          <CardHeader>
            <CardTitle>最近批次</CardTitle>
            <CardDescription>最多显示最近 50 个发行批次</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>批次</TableHead>
                  <TableHead>面值</TableHead>
                  <TableHead>兑换进度</TableHead>
                  <TableHead>可用</TableHead>
                  <TableHead>有效期</TableHead>
                  <TableHead>创建时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {batches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center">
                      <KeyRound className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
                      <p className="text-muted-foreground">还没有生成兑换码</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  batches.map((batch) => {
                    const rate =
                      batch.totalCount > 0
                        ? Math.round(
                            (batch.redeemedCount / batch.totalCount) * 100
                          )
                        : 0;
                    const expired =
                      batch.expiresAt !== null &&
                      new Date(batch.expiresAt) <= new Date();
                    return (
                      <TableRow key={batch.batchId}>
                        <TableCell>
                          <code className="whitespace-nowrap rounded bg-muted px-2 py-1 text-xs">
                            {batch.batchId}
                          </code>
                        </TableCell>
                        <TableCell className="font-medium">
                          ¥{batch.faceValue}
                        </TableCell>
                        <TableCell>
                          <div className="min-w-28 space-y-1">
                            <div className="flex justify-between text-xs">
                              <span>
                                {batch.redeemedCount.toLocaleString("zh-CN")} /{" "}
                                {batch.totalCount.toLocaleString("zh-CN")}
                              </span>
                              <span className="text-muted-foreground">{rate}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-primary"
                                style={{ width: `${rate}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{batch.availableCount.toLocaleString("zh-CN")}</TableCell>
                        <TableCell>
                          {batch.expiresAt ? (
                            <Badge variant={expired ? "destructive" : "outline"}>
                              {expired ? "已过期" : formatDate(batch.expiresAt)}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">永久有效</Badge>
                          )}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {formatDate(batch.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={generated !== null}
        onOpenChange={(open) => {
          if (!open) setGenerated(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              兑换码生成成功
            </DialogTitle>
            <DialogDescription>
              明文兑换码不会保存到数据库。关闭此窗口后将无法再次查看，请立即下载并妥善保管。
            </DialogDescription>
          </DialogHeader>

          {generated ? (
            <div className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>仅显示一次</AlertTitle>
                <AlertDescription>
                  共 {generated.codes.length.toLocaleString("zh-CN")} 个，面值 ¥
                  {generated.faceValue}，批次 {generated.batchId}
                </AlertDescription>
              </Alert>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button className="flex-1" onClick={downloadCsv}>
                  <Download className="h-4 w-4" />
                  下载 CSV（推荐）
                </Button>
                <Button className="flex-1" variant="outline" onClick={copyCodes}>
                  <Copy className="h-4 w-4" />
                  复制全部
                </Button>
              </div>

              <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted/30 p-3">
                <div className="grid gap-2 font-mono text-xs sm:grid-cols-2">
                  {generated.codes.slice(0, 100).map((code) => (
                    <div key={code} className="rounded border bg-background px-3 py-2">
                      {code}
                    </div>
                  ))}
                </div>
                {generated.codes.length > 100 ? (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    页面仅预览前 100 个，其余请通过 CSV 查看
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
