import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Filter, Calendar, DollarSign } from 'lucide-react';
import { AnimatedCard } from '@/components/ui/animated-components';

interface AdminMatchFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  gameFilter: string;
  onGameFilterChange: (game: string) => void;
  platformFilter: string;
  onPlatformFilterChange: (platform: string) => void;
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  minStake: string;
  onMinStakeChange: (stake: string) => void;
  maxStake: string;
  onMaxStakeChange: (stake: string) => void;
}

export const AdminMatchFilters = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  gameFilter,
  onGameFilterChange,
  platformFilter,
  onPlatformFilterChange,
  dateRange,
  onDateRangeChange,
  minStake,
  onMinStakeChange,
  maxStake,
  onMaxStakeChange
}: AdminMatchFiltersProps) => {
  return (
    <AnimatedCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="w-5 h-5" />
          Advanced Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="financial">Financial</TabsTrigger>
            <TabsTrigger value="technical">Technical</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search Matches</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="search"
                    placeholder="Search by title, creator, game..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Status Filter</Label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Game Filter</Label>
                <Select value={gameFilter} onValueChange={onGameFilterChange}>
                  <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
                    <SelectValue placeholder="All games" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Games</SelectItem>
                    <SelectItem value="call-of-duty">Call of Duty</SelectItem>
                    <SelectItem value="fortnite">Fortnite</SelectItem>
                    <SelectItem value="apex-legends">Apex Legends</SelectItem>
                    <SelectItem value="fifa">FIFA</SelectItem>
                    <SelectItem value="rocket-league">Rocket League</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Platform Filter</Label>
                <Select value={platformFilter} onValueChange={onPlatformFilterChange}>
                  <SelectTrigger className="transition-all duration-200 hover:scale-[1.02]">
                    <SelectValue placeholder="All platforms" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Platforms</SelectItem>
                    <SelectItem value="PC">PC</SelectItem>
                    <SelectItem value="PlayStation">PlayStation</SelectItem>
                    <SelectItem value="Xbox">Xbox</SelectItem>
                    <SelectItem value="Mobile">Mobile</SelectItem>
                    <SelectItem value="Cross-Platform">Cross-Platform</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minStake">Minimum Stake ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="minStake"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={minStake}
                    onChange={(e) => onMinStakeChange(e.target.value)}
                    className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxStake">Maximum Stake ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="maxStake"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="1000.00"
                    value={maxStake}
                    onChange={(e) => onMaxStakeChange(e.target.value)}
                    className="pl-10 transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Financial Summary</h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Total Volume</span>
                  <div className="font-semibold text-money-green">$12,345.67</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Platform Fees</span>
                  <div className="font-semibold">$617.28</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Avg. Stake</span>
                  <div className="font-semibold">$45.32</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Created Date Range</Label>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.from?.toISOString().split('T')[0] || ''}
                    onChange={(e) => onDateRangeChange({
                      ...dateRange,
                      from: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                  <Input
                    type="date"
                    value={dateRange.to?.toISOString().split('T')[0] || ''}
                    onChange={(e) => onDateRangeChange({
                      ...dateRange,
                      to: e.target.value ? new Date(e.target.value) : undefined
                    })}
                    className="transition-all duration-200 focus:scale-[1.02]"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-semibold mb-2">Quick Filters</h4>
              <div className="flex flex-wrap gap-2">
                <button 
                  className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  onClick={() => onDateRangeChange({ from: new Date(Date.now() - 24*60*60*1000), to: new Date() })}
                >
                  Last 24h
                </button>
                <button 
                  className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  onClick={() => onDateRangeChange({ from: new Date(Date.now() - 7*24*60*60*1000), to: new Date() })}
                >
                  Last 7 days
                </button>
                <button 
                  className="px-3 py-1 text-xs bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                  onClick={() => onDateRangeChange({ from: new Date(Date.now() - 30*24*60*60*1000), to: new Date() })}
                >
                  Last 30 days
                </button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </AnimatedCard>
  );
};