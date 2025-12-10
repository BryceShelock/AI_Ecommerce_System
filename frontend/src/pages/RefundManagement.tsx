import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Refund {
  id: string;
  order_id: string;
  user_id: string;
  amount: number;
  reason: string;
  status: string;
  images: string[];
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export const RefundManagement = () => {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRefunds();
    subscribeToRefunds();
  }, []);

  const fetchRefunds = async () => {
    try {
      const { data, error } = await supabase
        .from('order_refunds')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRefunds((data || []).map(r => ({
        ...r,
        images: Array.isArray(r.images) ? r.images : []
      })) as Refund[]);
    } catch (error) {
      console.error('Failed to fetch refunds:', error);
    }
  };

  const subscribeToRefunds = () => {
    const channel = supabase
      .channel('refunds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_refunds'
        },
        () => {
          fetchRefunds();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleUpdateStatus = async (refundId: string, status: 'approved' | 'rejected') => {
    if (!adminNote.trim()) {
      toast.error('请添加审批备注');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('order_refunds')
        .update({
          status,
          admin_note: adminNote,
          processed_at: new Date().toISOString(),
        })
        .eq('id', refundId);

      if (error) throw error;

      toast.success(status === 'approved' ? '已批准退款' : '已拒绝退款');
      setSelectedRefund(null);
      setAdminNote('');
      fetchRefunds();
    } catch (error) {
      console.error('Failed to update refund:', error);
      toast.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: '待审核', variant: 'secondary' as const, icon: Clock },
      approved: { label: '已批准', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: '已拒绝', variant: 'destructive' as const, icon: XCircle },
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const filterByStatus = (status: string) => {
    return refunds.filter(r => status === 'all' || r.status === status);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>退款申请管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {refunds.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无退款申请</p>
            ) : (
              refunds.map((refund) => (
                <Card key={refund.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold">订单号: {refund.order_id.slice(0, 8)}...</span>
                          {getStatusBadge(refund.status)}
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="text-muted-foreground">退款金额: <span className="font-semibold text-cta">¥{refund.amount}</span></p>
                          <p className="text-muted-foreground">申请原因: {refund.reason}</p>
                          <p className="text-muted-foreground">申请时间: {new Date(refund.created_at).toLocaleString('zh-CN')}</p>
                          {refund.admin_note && (
                            <p className="text-muted-foreground">审批备注: {refund.admin_note}</p>
                          )}
                        </div>
                        {refund.images && refund.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {refund.images.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`凭证${idx + 1}`}
                                className="w-16 h-16 object-cover rounded cursor-pointer"
                                onClick={() => window.open(img, '_blank')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      {refund.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedRefund(refund);
                            setAdminNote(refund.admin_note || '');
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          审核
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRefund} onOpenChange={() => setSelectedRefund(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>审核退款申请</DialogTitle>
          </DialogHeader>
          {selectedRefund && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm"><span className="font-semibold">订单号:</span> {selectedRefund.order_id}</p>
                <p className="text-sm"><span className="font-semibold">退款金额:</span> ¥{selectedRefund.amount}</p>
                <p className="text-sm"><span className="font-semibold">申请原因:</span> {selectedRefund.reason}</p>
                <p className="text-sm"><span className="font-semibold">申请时间:</span> {new Date(selectedRefund.created_at).toLocaleString('zh-CN')}</p>
              </div>

              {selectedRefund.images && selectedRefund.images.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-2">凭证图片:</p>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedRefund.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`凭证${idx + 1}`}
                        className="w-full h-24 object-cover rounded cursor-pointer"
                        onClick={() => window.open(img, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold">审批备注 *</label>
                <Textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="请输入审批意见..."
                  className="min-h-[100px]"
                  maxLength={500}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRefund(null)}
              disabled={loading}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedRefund && handleUpdateStatus(selectedRefund.id, 'rejected')}
              disabled={loading}
            >
              <XCircle className="h-4 w-4 mr-1" />
              拒绝
            </Button>
            <Button
              onClick={() => selectedRefund && handleUpdateStatus(selectedRefund.id, 'approved')}
              disabled={loading}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              批准
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
