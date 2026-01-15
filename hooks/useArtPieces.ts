import { useState, useEffect, useCallback } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { ArtPiece } from '../types';
import { getArtPieces, getAllArtPieces, getArtPieceById } from '../lib/firebase/firestore';

export const useArtPieces = (pageSize = 20) => {
  const [artPieces, setArtPieces] = useState<ArtPiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchInitial = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getArtPieces(pageSize);
      setArtPieces(result.docs);
      setLastDoc(result.lastDoc);
      setHasMore(result.docs.length === pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const result = await getArtPieces(pageSize, lastDoc);
      setArtPieces(prev => [...prev, ...result.docs]);
      setLastDoc(result.lastDoc);
      setHasMore(result.docs.length === pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [pageSize, lastDoc, hasMore, isLoadingMore]);

  const refresh = useCallback(() => {
    setArtPieces([]);
    setLastDoc(null);
    setHasMore(true);
    fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  return {
    artPieces,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refresh
  };
};

export const useAllArtPieces = () => {
  const [artPieces, setArtPieces] = useState<ArtPiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await getAllArtPieces();
      setArtPieces(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return {
    artPieces,
    isLoading,
    error,
    refresh: fetchAll
  };
};

export const useArtPiece = (id: string | null) => {
  const [artPiece, setArtPiece] = useState<ArtPiece | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!id) {
      setArtPiece(null);
      setIsLoading(false);
      return;
    }

    const fetch = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const result = await getArtPieceById(id);
        setArtPiece(result);
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };

    fetch();
  }, [id]);

  return { artPiece, isLoading, error };
};
