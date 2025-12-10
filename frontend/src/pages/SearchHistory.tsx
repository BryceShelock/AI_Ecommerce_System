import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, History, TrendingUp, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchHistoryProps {
  onSearch: (keyword: string) => void;
}

export const SearchHistory = ({ onSearch }: SearchHistoryProps) => {
  const [history, setHistory] = useState<string[]>([]);
  const [hotTerms, setHotTerms] = useState<string[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchHotTerms();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setIsLoggedIn(true);
      fetchHistory(user.id);
    }
  };

  const fetchHistory = async (userId: string) => {
    const { data } = await supabase
      .from('search_history')
      .select('keyword')
      .eq('user_id', userId)
      .order('last_searched_at', { ascending: false })
      .limit(10);
    
    if (data) {
      setHistory(data.map(d => d.keyword));
    }
  };

  const fetchHotTerms = async () => {
    const { data } = await supabase
      .from('hot_search_terms')
      .select('keyword')
      .order('search_count', { ascending: false })
      .limit(8);
    
    if (data) {
      setHotTerms(data.map(d => d.keyword));
    }
  };

  const clearHistory = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id);
    
    setHistory([]);
  };

  const removeHistoryItem = async (keyword: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id)
      .eq('keyword', keyword);
    
    setHistory(prev => prev.filter(k => k !== keyword));
  };

  if (history.length === 0 && hotTerms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      {/* Hot Search Terms */}
      {hotTerms.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-cta" />
            <span className="text-sm font-medium">热门搜索</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotTerms.map((term, idx) => (
              <Badge
                key={term}
                variant={idx < 3 ? "default" : "secondary"}
                className="cursor-pointer hover:opacity-80"
                onClick={() => onSearch(term)}
              >
                {idx < 3 && <span className="mr-1">{idx + 1}</span>}
                {term}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Search History */}
      {isLoggedIn && history.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">搜索历史</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="h-6 px-2 text-xs"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              清空
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {history.map((keyword) => (
              <Badge
                key={keyword}
                variant="outline"
                className="cursor-pointer hover:bg-muted group"
              >
                <span onClick={() => onSearch(keyword)}>{keyword}</span>
                <X
                  className="h-3 w-3 ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeHistoryItem(keyword);
                  }}
                />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
