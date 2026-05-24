type PageHeaderProps = {
  title: string;
  detail: string;
};

export function PageHeader({ title, detail }: PageHeaderProps) {
  return (
    <div className="page-header">
      <div>
        <h2>{title}</h2>
        <p>{detail}</p>
      </div>
    </div>
  );
}
