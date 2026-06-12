import Card from '../ui/Card';
import SearchDropdown from '../SearchDropdown';

// Drug search box wrapped in a card. All SearchDropdown props pass through, so
// each page supplies its own renderItem / placeholder / hint / disabled state.
export default function DrugSearchCard({ cardClassName, ...dropdownProps }) {
  return (
    <Card className={cardClassName}>
      <SearchDropdown allowClear={false} {...dropdownProps} />
    </Card>
  );
}
